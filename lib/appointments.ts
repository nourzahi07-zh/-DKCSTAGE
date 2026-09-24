import { isPast } from "@/lib/format";
import type { Enums } from "@/types/database";

/**
 * Pure appointment rules used by the UI (no database access), kept in step
 * with the database: cancel_appointment() applies exactly the same condition
 * server-side, so this only decides what to display.
 */

type AppointmentLike = {
  appointment_date: string;
  start_time: string;
  status: Enums<"appointment_status">;
};

/** Splits into upcoming (soonest first) and past/closed (most recent first). */
export function splitAppointments<T extends AppointmentLike>(appointments: T[]) {
  const upcoming: T[] = [];
  const past: T[] = [];

  for (const appointment of appointments) {
    const over =
      appointment.status === "completed" ||
      appointment.status === "cancelled" ||
      isPast(appointment.appointment_date, appointment.start_time);
    (over ? past : upcoming).push(appointment);
  }

  upcoming.sort((a, b) =>
    `${a.appointment_date}${a.start_time}`.localeCompare(`${b.appointment_date}${b.start_time}`),
  );
  past.sort((a, b) =>
    `${b.appointment_date}${b.start_time}`.localeCompare(`${a.appointment_date}${a.start_time}`),
  );
  return { upcoming, past };
}

/** A patient may cancel their own pending/confirmed appointment before it starts. */
export function canCancel(appointment: AppointmentLike): boolean {
  return (
    (appointment.status === "pending" || appointment.status === "confirmed") &&
    !isPast(appointment.appointment_date, appointment.start_time)
  );
}
