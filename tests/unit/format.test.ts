import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dateInDays,
  firstName,
  formatDate,
  formatDateCompact,
  formatDuration,
  formatPrice,
  formatTime,
  initials,
  isPast,
  todayInMorocco,
} from "@/lib/format";

afterEach(() => vi.useRealTimers());

describe("dates and times", () => {
  it("formats a date in French without shifting the day", () => {
    expect(formatDate("2026-05-04")).toBe("lundi 4 mai 2026");
    expect(formatDate("2026-01-01", "short")).toBe("1 janv. 2026");
    expect(formatDateCompact("2026-05-04")).toBe("lun. 4 mai");
  });

  it("formats times and durations", () => {
    expect(formatTime("14:30:00")).toBe("14:30");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(90)).toBe("1 h 30");
  });

  it("uses Morocco time for 'today', not the machine timezone", () => {
    // 00:30 UTC on 4 May = 01:30 in Casablanca (UTC+1), still 4 May.
    vi.setSystemTime(new Date("2026-05-04T00:30:00Z"));
    expect(todayInMorocco()).toBe("2026-05-04");
    expect(dateInDays(60)).toBe("2026-07-03");
  });

  it("knows whether a date and time has passed", () => {
    vi.setSystemTime(new Date("2026-05-04T10:00:00Z")); // 11:00 in Casablanca
    expect(isPast("2026-05-03", "23:00")).toBe(true);
    expect(isPast("2026-05-04", "09:00")).toBe(true);
    expect(isPast("2026-05-04", "15:00")).toBe(false);
    expect(isPast("2026-05-05", "08:00")).toBe(false);
  });
});

describe("prices", () => {
  it("formats an amount in MAD and never invents a price", () => {
    // fr-FR groups thousands with a narrow no-break space (U+202F).
    expect(formatPrice(1700)).toBe("1 700 MAD");
    expect(formatPrice("250.00")).toBe("250 MAD");
    expect(formatPrice(null)).toBe("Tarif sur demande");
    expect(formatPrice("")).toBe("Tarif sur demande");
  });
});

describe("names", () => {
  it("extracts a first name and initials", () => {
    expect(firstName("Amina Benali")).toBe("Amina");
    expect(initials("Amina Benali")).toBe("AB");
    expect(initials("Rihab")).toBe("R");
  });
});
