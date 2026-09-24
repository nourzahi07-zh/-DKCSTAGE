import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canCancel, splitAppointments } from "@/lib/appointments";
import { dbErrorMessage, GENERIC_DB_ERROR } from "@/lib/db/errors";
import type { Enums } from "@/types/database";

type Status = Enums<"appointment_status">;

function appointment(date: string, time: string, status: Status = "confirmed") {
  return { appointment_date: date, start_time: time, status };
}

beforeEach(() => {
  // 4 May 2026, 11:00 in Casablanca.
  vi.setSystemTime(new Date("2026-05-04T10:00:00Z"));
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.useRealTimers());

describe("splitAppointments", () => {
  it("separates upcoming from past and sorts both", () => {
    const list = [
      appointment("2026-05-10", "09:00"),
      appointment("2026-05-04", "09:00"), // earlier today -> past
      appointment("2026-05-04", "16:00"), // later today -> upcoming
      appointment("2026-04-20", "10:00"),
    ];
    const { upcoming, past } = splitAppointments(list);

    expect(upcoming.map((a) => a.appointment_date + a.start_time)).toEqual([
      "2026-05-0416:00",
      "2026-05-1009:00",
    ]);
    expect(past.map((a) => a.appointment_date + a.start_time)).toEqual([
      "2026-05-0409:00",
      "2026-04-2010:00",
    ]);
  });

  it("treats completed and cancelled appointments as past even in the future", () => {
    const { upcoming, past } = splitAppointments([
      appointment("2026-06-01", "10:00", "cancelled"),
      appointment("2026-06-02", "10:00", "completed"),
      appointment("2026-06-03", "10:00", "pending"),
    ]);
    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(2);
  });
});

describe("canCancel", () => {
  it.each([
    ["future pending", appointment("2026-05-10", "09:00", "pending"), true],
    ["future confirmed", appointment("2026-05-10", "09:00", "confirmed"), true],
    ["already started", appointment("2026-05-04", "09:00", "confirmed"), false],
    ["already cancelled", appointment("2026-05-10", "09:00", "cancelled"), false],
    ["completed", appointment("2026-05-01", "09:00", "completed"), false],
  ])("%s", (_label, value, expected) => {
    expect(canCancel(value)).toBe(expected);
  });
});

describe("dbErrorMessage", () => {
  it("translates the database's DKC_ codes into French", () => {
    expect(dbErrorMessage({ message: 'erreur: DKC_SLOT_TAKEN' }, "book")).toMatch(
      /vient d'être réservé/,
    );
    expect(dbErrorMessage({ message: "DKC_HOME_ADDRESS_REQUIRED" }, "book")).toMatch(/adresse/i);
    expect(dbErrorMessage({ message: "DKC_TOO_MANY_APPOINTMENTS" }, "book")).toMatch(/maximum/);
    expect(dbErrorMessage({ message: "DKC_NOT_FOUND" }, "cancel")).toMatch(/introuvable/);
  });

  it("hides anything else behind a generic message", () => {
    const message = dbErrorMessage(
      { code: "42501", message: 'permission denied for table "appointments"' },
      "book",
    );
    expect(message).toBe(GENERIC_DB_ERROR);
    expect(message).not.toMatch(/permission denied/);
  });
});
