/**
 * Database security & appointment-engine tests.
 * Runs the real migrations in PGlite (real PostgreSQL) - no Supabase project
 * or Docker needed. Every test gets a fresh database.
 */
import { beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { as, createTestDb, createUser, localDate, promoteToAdmin, serviceId } from "./harness";

let db: PGlite;
let patientA: string;
let patientB: string;
let admin: string;

beforeEach(async () => {
  db = await createTestDb();
  patientA = await createUser(db, "a@test.local");
  patientB = await createUser(db, "b@test.local");
  admin = await createUser(db, "rihab@test.local", { full_name: "Rihab" });
  await promoteToAdmin(db, admin);
  // Open every day 08:00-20:00 so "tomorrow" always has slots.
  await db.exec(`
    insert into public.availability_rules (weekday, start_time, end_time)
    select d, '08:00', '20:00' from generate_series(1, 7) d;
  `);
});

async function book(uid: string, service: string, date: string, start: string, location = "cabinet", address: string | null = null) {
  const res = await as<{ id: string }>(
    db,
    { uid },
    "select public.book_appointment($1, $2, $3, $4, $5) as id",
    [await serviceId(db, service), date, start, location, address],
  );
  return res.rows[0].id;
}

async function slots(service: string, date: string, who: "anon" | { uid: string } = "anon") {
  const res = await as<{ start_time: string }>(
    db,
    who,
    "select start_time::text from public.get_available_slots($1, $2)",
    [await serviceId(db, service), date],
  );
  return res.rows.map((r) => r.start_time);
}

// ---------------------------------------------------------------------------
describe("profiles & roles", () => {
  it("sign-up creates a patient profile, ignoring any role in the metadata", async () => {
    const uid = await createUser(db, "hacker@test.local", { full_name: "Hacker", role: "admin" });
    const res = await db.query<{ role: string; full_name: string }>(
      "select role, full_name from public.profiles where id = $1", [uid]);
    expect(res.rows[0]).toEqual({ role: "patient", full_name: "Hacker" });
  });

  it("a patient cannot make themself admin", async () => {
    await expect(as(db, { uid: patientA },
      "update public.profiles set role = 'admin' where id = $1", [patientA]))
      .rejects.toThrow(/DKC_FORBIDDEN_FIELD/);
  });

  it("a patient can update their own name and phone", async () => {
    await as(db, { uid: patientA },
      "update public.profiles set full_name = 'Nouveau Nom', phone = '0600000000' where id = $1", [patientA]);
    const res = await db.query<{ full_name: string }>("select full_name from public.profiles where id = $1", [patientA]);
    expect(res.rows[0].full_name).toBe("Nouveau Nom");
  });

  it("a patient cannot read or modify another patient's profile", async () => {
    const read = await as(db, { uid: patientA }, "select * from public.profiles where id = $1", [patientB]);
    expect(read.rows).toHaveLength(0);
    const upd = await as(db, { uid: patientA },
      "update public.profiles set full_name = 'Pirate' where id = $1", [patientB]);
    expect(upd.affectedRows).toBe(0);
  });

  it("a patient cannot deactivate themself; an admin can deactivate a patient", async () => {
    await expect(as(db, { uid: patientA },
      "update public.profiles set is_active = false where id = $1", [patientA]))
      .rejects.toThrow(/DKC_FORBIDDEN_FIELD/);
    await as(db, { uid: admin }, "update public.profiles set is_active = false where id = $1", [patientA]);
    const res = await db.query<{ is_active: boolean }>("select is_active from public.profiles where id = $1", [patientA]);
    expect(res.rows[0].is_active).toBe(false);
  });

  it("even an admin cannot change a role through the API", async () => {
    await expect(as(db, { uid: admin },
      "update public.profiles set role = 'admin' where id = $1", [patientA]))
      .rejects.toThrow(/DKC_FORBIDDEN_FIELD/);
  });

  it("an admin can read every profile; anonymous visitors cannot read any", async () => {
    const all = await as(db, { uid: admin }, "select id from public.profiles");
    expect(all.rows).toHaveLength(3);
    await expect(as(db, "anon", "select * from public.profiles")).rejects.toThrow(/permission denied/);
  });
});

// ---------------------------------------------------------------------------
describe("services", () => {
  it("visitors see the 18 seeded active services, not inactive ones", async () => {
    expect((await as(db, "anon", "select id from public.services")).rows).toHaveLength(18);
    await db.query("update public.services set is_active = false where name = 'Massage Thaï'");
    expect((await as(db, "anon", "select id from public.services")).rows).toHaveLength(17);
    expect((await as(db, { uid: admin }, "select id from public.services")).rows).toHaveLength(18);
  });

  it("only an admin can create or modify a service", async () => {
    const insert = "insert into public.services (name, category, duration_minutes) values ('Test', 'massage', 60)";
    await expect(as(db, "anon", insert)).rejects.toThrow(/permission denied/);
    await expect(as(db, { uid: patientA }, insert)).rejects.toThrow(/row-level security/);
    const upd = await as(db, { uid: patientA }, "update public.services set price = 1");
    expect(upd.affectedRows).toBe(0);
    await as(db, { uid: admin }, insert);
    expect((await db.query("select 1 from public.services where name = 'Test'")).rows).toHaveLength(1);
  });

  it("a service used by an appointment cannot be deleted", async () => {
    await book(patientA, "Massage Relaxant", await localDate(db, 1), "10:00");
    await expect(as(db, { uid: admin }, "delete from public.services where name = 'Massage Relaxant'"))
      .rejects.toThrow(/foreign key/);
  });
});

// ---------------------------------------------------------------------------
describe("availability & slots", () => {
  it("raw availability is hidden from visitors and patients", async () => {
    await expect(as(db, "anon", "select * from public.availability_rules")).rejects.toThrow(/permission denied/);
    expect((await as(db, { uid: patientA }, "select * from public.availability_rules")).rows).toHaveLength(0);
    await expect(as(db, { uid: patientA },
      "insert into public.availability_rules (weekday, start_time, end_time) values (1, '08:00', '09:00')"))
      .rejects.toThrow(/row-level security/);
  });

  it("generates 30-minute slots where the whole service fits", async () => {
    const s = await slots("Massage Relaxant", await localDate(db, 1)); // 60 min, 08:00-20:00
    expect(s[0]).toBe("08:00:00");
    expect(s.at(-1)).toBe("19:00:00");
    expect(s).toHaveLength(23);
  });

  it("returns no slots in the past or beyond the booking horizon", async () => {
    expect(await slots("Massage Relaxant", await localDate(db, -1))).toHaveLength(0);
    expect(await slots("Massage Relaxant", await localDate(db, 61))).toHaveLength(0);
  });

  it("a closed exception closes the day; an open exception replaces the hours", async () => {
    const d1 = await localDate(db, 1);
    const d2 = await localDate(db, 2);
    await db.query("insert into public.availability_exceptions (date, is_closed) values ($1, true)", [d1]);
    await db.query(
      "insert into public.availability_exceptions (date, start_time, end_time) values ($1, '14:00', '16:00')", [d2]);
    expect(await slots("Massage Relaxant", d1)).toHaveLength(0);
    expect(await slots("Massage Relaxant", d2)).toEqual(["14:00:00", "14:30:00", "15:00:00"]);
  });

  it("inactive services have no slots", async () => {
    await db.query("update public.services set is_active = false where name = 'Massage Relaxant'");
    expect(await slots("Massage Relaxant", await localDate(db, 1))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
describe("booking", () => {
  it("a patient books a pending appointment; end time comes from the service", async () => {
    const id = await book(patientA, "Massage Relaxant", await localDate(db, 1), "10:00");
    const res = await db.query<{ status: string; end_time: string; patient_id: string }>(
      "select status, end_time::text, patient_id from public.appointments where id = $1", [id]);
    expect(res.rows[0]).toEqual({ status: "pending", end_time: "11:00:00", patient_id: patientA });
  });

  it("visitors cannot book", async () => {
    await expect(as(db, "anon", "select public.book_appointment($1, current_date, '10:00', 'cabinet')",
      [await serviceId(db, "Massage Relaxant")])).rejects.toThrow(/permission denied/);
  });

  it("patients cannot write the appointments table directly", async () => {
    const sid = await serviceId(db, "Massage Relaxant");
    await expect(as(db, { uid: patientA },
      `insert into public.appointments (patient_id, service_id, appointment_date, start_time, end_time, location_type)
       values ($1, $2, current_date + 1, '10:00', '11:00', 'cabinet')`, [patientA, sid]))
      .rejects.toThrow(/permission denied/);
  });

  it("a booked time disappears and overlapping bookings are refused", async () => {
    const d = await localDate(db, 1);
    await book(patientA, "Massage Relaxant", d, "10:00"); // 10:00-11:00
    const s = await slots("Massage Relaxant", d);
    expect(s).not.toContain("10:00:00");
    expect(s).not.toContain("09:30:00"); // 09:30-10:30 would overlap
    expect(s).not.toContain("10:30:00");
    expect(s).toContain("11:00:00");
    await expect(book(patientB, "Massage Relaxant", d, "10:00")).rejects.toThrow(/DKC_SLOT_UNAVAILABLE/);
    await expect(book(patientB, "Hijama Humide", d, "10:30")).rejects.toThrow(/DKC_SLOT_UNAVAILABLE/);
  });

  it("cabinet and home visits share one calendar", async () => {
    const d = await localDate(db, 1);
    await book(patientA, "Massage Relaxant", d, "10:00", "home", "12 Rue Exemple, Fès");
    await expect(book(patientB, "Hijama Humide", d, "10:00", "cabinet")).rejects.toThrow(/DKC_SLOT_UNAVAILABLE/);
  });

  it("the database itself rejects overlapping active appointments (race protection)", async () => {
    const sid = await serviceId(db, "Massage Relaxant");
    const insert = `insert into public.appointments
      (patient_id, service_id, appointment_date, start_time, end_time, location_type)
      values ($1, $2, current_date + 5, $3, $4, 'cabinet')`;
    await db.query(insert, [patientA, sid, "10:00", "11:00"]);
    await expect(db.query(insert, [patientB, sid, "10:30", "11:30"])).rejects.toThrow(/appointments_no_overlap/);
  });

  it("rejects an unavailable time, a wrong location and a missing home address", async () => {
    const d = await localDate(db, 1);
    await expect(book(patientA, "Massage Relaxant", d, "07:00")).rejects.toThrow(/DKC_SLOT_UNAVAILABLE/);
    await expect(book(patientA, "Massage Relaxant", d, "10:15")).rejects.toThrow(/DKC_SLOT_UNAVAILABLE/);
    await expect(book(patientA, "Massage Relaxant", await localDate(db, -1), "10:00")).rejects.toThrow(/DKC_SLOT_UNAVAILABLE/);
    await expect(book(patientA, "Hijama Humide", d, "10:00", "home", "12 Rue Exemple")).rejects.toThrow(/DKC_LOCATION_NOT_OFFERED/);
    await expect(book(patientA, "Massage Relaxant", d, "10:00", "home", null)).rejects.toThrow(/DKC_HOME_ADDRESS_REQUIRED/);
  });

  it("a deactivated patient and an admin cannot book", async () => {
    await promoteToAdmin(db, patientB);
    await db.query("update public.profiles set is_active = false where id = $1", [patientA]);
    const d = await localDate(db, 1);
    await expect(book(patientA, "Massage Relaxant", d, "10:00")).rejects.toThrow(/DKC_FORBIDDEN/);
    await expect(book(admin, "Massage Relaxant", d, "10:00")).rejects.toThrow(/DKC_FORBIDDEN/);
  });
});

// ---------------------------------------------------------------------------
describe("privacy, cancellation & admin status changes", () => {
  it("a patient only sees their own appointments; the admin sees all", async () => {
    const d = await localDate(db, 1);
    await book(patientA, "Massage Relaxant", d, "10:00");
    await book(patientB, "Massage Relaxant", d, "14:00");
    const mine = await as<{ patient_id: string }>(db, { uid: patientA }, "select patient_id from public.appointments");
    expect(mine.rows).toEqual([{ patient_id: patientA }]);
    expect((await as(db, { uid: admin }, "select id from public.appointments")).rows).toHaveLength(2);
  });

  it("a patient cannot cancel someone else's appointment, and it looks like 'not found'", async () => {
    const id = await book(patientB, "Massage Relaxant", await localDate(db, 1), "10:00");
    await expect(as(db, { uid: patientA }, "select public.cancel_appointment($1)", [id]))
      .rejects.toThrow(/DKC_NOT_FOUND/);
  });

  it("a patient cancels their own appointment and the slot becomes free again", async () => {
    const d = await localDate(db, 1);
    const id = await book(patientA, "Massage Relaxant", d, "10:00");
    await as(db, { uid: patientA }, "select public.cancel_appointment($1)", [id]);
    const res = await db.query<{ status: string; cancelled_by: string }>(
      "select status, cancelled_by from public.appointments where id = $1", [id]);
    expect(res.rows[0]).toEqual({ status: "cancelled", cancelled_by: "patient" });
    expect(await slots("Massage Relaxant", d)).toContain("10:00:00");
    await expect(as(db, { uid: patientA }, "select public.cancel_appointment($1)", [id]))
      .rejects.toThrow(/DKC_INVALID_STATUS/);
  });

  it("patients cannot change a status; the admin confirms then completes", async () => {
    const id = await book(patientA, "Massage Relaxant", await localDate(db, 1), "10:00");
    await expect(as(db, { uid: patientA }, "select public.set_appointment_status($1, 'confirmed')", [id]))
      .rejects.toThrow(/DKC_FORBIDDEN/);
    await expect(as(db, { uid: admin }, "select public.set_appointment_status($1, 'completed')", [id]))
      .rejects.toThrow(/DKC_INVALID_STATUS/); // pending -> completed is not allowed
    await as(db, { uid: admin }, "select public.set_appointment_status($1, 'confirmed')", [id]);
    await expect(as(db, { uid: admin }, "select public.set_appointment_status($1, 'completed')", [id]))
      .rejects.toThrow(/DKC_NOT_STARTED/); // it's tomorrow

    // A confirmed appointment from yesterday can be marked as completed.
    const past = await db.query<{ id: string }>(
      `insert into public.appointments
        (patient_id, service_id, appointment_date, start_time, end_time, location_type, status)
       values ($1, $2, public.now_local()::date - 1, '10:00', '11:00', 'cabinet', 'confirmed') returning id`,
      [patientA, await serviceId(db, "Massage Relaxant")]);
    await as(db, { uid: admin }, "select public.set_appointment_status($1, 'completed')", [past.rows[0].id]);
    const res = await db.query<{ status: string }>("select status from public.appointments where id = $1", [past.rows[0].id]);
    expect(res.rows[0].status).toBe("completed");
  });

  it("the admin can cancel any upcoming appointment", async () => {
    const id = await book(patientA, "Massage Relaxant", await localDate(db, 1), "10:00");
    await as(db, { uid: admin }, "select public.set_appointment_status($1, 'cancelled')", [id]);
    const res = await db.query<{ cancelled_by: string }>("select cancelled_by from public.appointments where id = $1", [id]);
    expect(res.rows[0].cancelled_by).toBe("admin");
  });
});
