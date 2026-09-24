import { APP_TIMEZONE } from "@/lib/cabinet";

/**
 * Date/time/price formatting. Everything is displayed in Morocco time, the
 * same timezone the database uses for its booking rules.
 */

/** "2026-05-04" -> "lundi 4 mai 2026" */
export function formatDate(date: string, style: "long" | "short" = "long"): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: style === "long" ? "long" : undefined,
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** "2026-05-04" -> "lun. 4 mai" */
export function formatDateCompact(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(d);
}

/** "14:30:00" -> "14:30" */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

/** 1700 -> "1 700 MAD", null -> "Tarif sur demande" */
export function formatPrice(price: number | string | null): string {
  if (price === null || price === "") return "Tarif sur demande";
  const value = typeof price === "string" ? Number(price) : price;
  if (Number.isNaN(value)) return "Tarif sur demande";
  return `${new Intl.NumberFormat("fr-FR").format(value)} MAD`;
}

/** 45 -> "45 min", 90 -> "1 h 30" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

/** Today in Morocco, as "YYYY-MM-DD" (same day the database considers today). */
export function todayInMorocco(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date());
}

/** "YYYY-MM-DD" N days after today in Morocco. */
export function dateInDays(days: number): string {
  const base = new Date(`${todayInMorocco()}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** True when the date+time is already in the past (Morocco time). */
export function isPast(date: string, time: string): boolean {
  const today = todayInMorocco();
  if (date !== today) return date < today;
  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  return time.slice(0, 5) <= now;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
