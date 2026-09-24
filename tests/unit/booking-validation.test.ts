import { describe, expect, it } from "vitest";
import {
  availabilityExceptionSchema,
  availabilityRuleSchema,
  bookingSchema,
  passwordChangeSchema,
  profileSchema,
  serviceSchema,
  statusChangeSchema,
} from "@/lib/validation/appointment";

const validBooking = {
  serviceId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  date: "2026-05-04",
  startTime: "10:00",
  location: "cabinet",
  homeAddress: "",
  notes: "",
};

describe("bookingSchema", () => {
  it("accepts a valid cabinet booking", () => {
    expect(bookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it("requires a real address for a home visit", () => {
    expect(bookingSchema.safeParse({ ...validBooking, location: "home" }).success).toBe(false);
    expect(
      bookingSchema.safeParse({ ...validBooking, location: "home", homeAddress: "12 Rue Exemple, Fès" })
        .success,
    ).toBe(true);
  });

  it.each([
    ["a bad service id", { serviceId: "not-a-uuid" }],
    ["a bad date", { date: "04/05/2026" }],
    ["a bad time", { startTime: "25:00" }],
    ["an unknown location", { location: "clinique" }],
    ["notes that are too long", { notes: "x".repeat(501) }],
  ])("rejects %s", (_label, override) => {
    expect(bookingSchema.safeParse({ ...validBooking, ...override }).success).toBe(false);
  });
});

describe("statusChangeSchema", () => {
  it("only accepts the statuses an admin may set", () => {
    const id = validBooking.serviceId;
    expect(statusChangeSchema.safeParse({ appointmentId: id, status: "confirmed" }).success).toBe(true);
    expect(statusChangeSchema.safeParse({ appointmentId: id, status: "completed" }).success).toBe(true);
    // "pending" is not something the admin sets by hand.
    expect(statusChangeSchema.safeParse({ appointmentId: id, status: "pending" }).success).toBe(false);
  });
});

describe("serviceSchema", () => {
  const valid = {
    name: "Massage Relaxant",
    description: "",
    category: "massage",
    price: "200",
    priceType: "session",
    sessionsIncluded: "",
    durationMinutes: "60",
    atCabinet: true,
    atHome: false,
    isActive: true,
  };

  it("accepts a valid service and an empty price (tarif sur demande)", () => {
    expect(serviceSchema.safeParse(valid).success).toBe(true);
    expect(serviceSchema.safeParse({ ...valid, price: "" }).success).toBe(true);
  });

  it("rejects a duration that is not a multiple of 15 minutes", () => {
    expect(serviceSchema.safeParse({ ...valid, durationMinutes: "50" }).success).toBe(false);
    expect(serviceSchema.safeParse({ ...valid, durationMinutes: "45" }).success).toBe(true);
  });

  it("requires at least one location", () => {
    expect(serviceSchema.safeParse({ ...valid, atCabinet: false, atHome: false }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(serviceSchema.safeParse({ ...valid, price: "-10" }).success).toBe(false);
  });
});

describe("availability schemas", () => {
  it("requires the end of a window to be after its start", () => {
    expect(availabilityRuleSchema.safeParse({ weekday: "1", startTime: "09:00", endTime: "17:00" }).success).toBe(true);
    expect(availabilityRuleSchema.safeParse({ weekday: "1", startTime: "17:00", endTime: "09:00" }).success).toBe(false);
    expect(availabilityRuleSchema.safeParse({ weekday: "8", startTime: "09:00", endTime: "17:00" }).success).toBe(false);
  });

  it("allows a closed day without hours, but requires hours otherwise", () => {
    expect(
      availabilityExceptionSchema.safeParse({ date: "2026-05-04", isClosed: true, startTime: "", endTime: "", reason: "Congé" }).success,
    ).toBe(true);
    expect(
      availabilityExceptionSchema.safeParse({ date: "2026-05-04", isClosed: false, startTime: "", endTime: "", reason: "" }).success,
    ).toBe(false);
    expect(
      availabilityExceptionSchema.safeParse({ date: "2026-05-04", isClosed: false, startTime: "14:00", endTime: "16:00", reason: "" }).success,
    ).toBe(true);
  });
});

describe("profile and password schemas", () => {
  it("normalizes the phone number and refuses a future birth date", () => {
    const parsed = profileSchema.parse({
      fullName: "Amina Benali",
      phone: "06 12-34.56.78",
      dateOfBirth: "",
    });
    expect(parsed.phone).toBe("0612345678");
    expect(
      profileSchema.safeParse({ fullName: "A B", phone: "0612345678", dateOfBirth: "2999-01-01" }).success,
    ).toBe(false);
  });

  it("requires a different, strong new password", () => {
    const base = { currentPassword: "ancien123", password: "nouveau123", confirmPassword: "nouveau123" };
    expect(passwordChangeSchema.safeParse(base).success).toBe(true);
    expect(passwordChangeSchema.safeParse({ ...base, password: "ancien123", confirmPassword: "ancien123" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ ...base, password: "court1", confirmPassword: "court1" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ ...base, confirmPassword: "autre1234" }).success).toBe(false);
  });
});
