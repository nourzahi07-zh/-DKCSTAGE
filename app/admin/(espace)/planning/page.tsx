import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Home, MapPin } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminBits";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { getAdminAppointments } from "@/lib/db/appointments";
import { getAvailabilityExceptions, getAvailabilityRules } from "@/lib/db/availability";
import { formatDate, formatTime, todayInMorocco } from "@/lib/format";

export const metadata: Metadata = { title: "Planning du jour" };

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Day view of the single shared calendar: cabinet and home visits appear in
 * the same timeline, because Rihab cannot be in two places at once.
 */
export default async function PlanningPage({ searchParams }: PageProps<"/admin/planning">) {
  const params = await searchParams;
  const date =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : todayInMorocco();

  const [appointments, rules, exceptions] = await Promise.all([
    getAdminAppointments({ from: date, to: date }),
    getAvailabilityRules(),
    getAvailabilityExceptions(date),
  ]);

  const active = appointments
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const weekday = ((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7) + 1; // ISO: 1 = Monday
  const exceptionsToday = exceptions.filter((e) => e.date === date);
  const closed = exceptionsToday.some((e) => e.is_closed);
  const windows = closed
    ? []
    : exceptionsToday.length > 0
      ? exceptionsToday.map((e) => ({ start: e.start_time!, end: e.end_time! }))
      : rules.filter((r) => r.weekday === weekday).map((r) => ({ start: r.start_time, end: r.end_time }));

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Planning du jour" description="Cabinet et domicile réunis sur un seul agenda." />

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/planning?date=${shiftDate(date, -1)}`}
            className="inline-flex size-9 items-center justify-center rounded-full border border-ink-200 text-ink-700 hover:bg-ink-50"
            aria-label="Jour précédent"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Link>
          <Link
            href={`/admin/planning?date=${shiftDate(date, 1)}`}
            className="inline-flex size-9 items-center justify-center rounded-full border border-ink-200 text-ink-700 hover:bg-ink-50"
            aria-label="Jour suivant"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
          <p className="ml-1 font-display text-lg font-semibold capitalize text-ink-900">
            {formatDate(date)}
          </p>
        </div>

        <form className="flex items-center gap-2" action="/admin/planning">
          <label htmlFor="date" className="text-sm text-ink-600">
            Aller au
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date}
            className="rounded-lg border border-ink-300 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Afficher
          </button>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Horaires d'ouverture ce jour"
          description={
            closed
              ? "Journée marquée comme fermée."
              : windows.length === 0
                ? "Aucun horaire configuré pour ce jour."
                : undefined
          }
        />
        <div className="flex flex-wrap gap-2 p-5">
          {closed ? (
            <span className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
              Fermé{exceptionsToday.find((e) => e.reason)?.reason
                ? ` — ${exceptionsToday.find((e) => e.reason)!.reason}`
                : ""}
            </span>
          ) : windows.length > 0 ? (
            windows.map((w, i) => (
              <span
                key={i}
                className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700"
              >
                {formatTime(w.start)} – {formatTime(w.end)}
              </span>
            ))
          ) : (
            <Link href="/admin/availability" className="text-sm font-semibold text-brand-700 hover:underline">
              Configurer vos disponibilités
            </Link>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Séances" description={`${active.length} rendez-vous`} />
        {active.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<CalendarDays aria-hidden="true" className="size-6" />}
              title="Aucun rendez-vous ce jour"
              description="Les rendez-vous en attente et confirmés apparaîtront sur cette journée."
            />
          </div>
        ) : (
          <ol className="divide-y divide-ink-100">
            {active.map((appointment) => (
              <li key={appointment.id} className="flex gap-4 p-5">
                <div className="w-16 shrink-0 text-right">
                  <p className="font-display text-lg font-semibold text-ink-900">
                    {formatTime(appointment.start_time)}
                  </p>
                  <p className="text-xs text-ink-500">{formatTime(appointment.end_time)}</p>
                </div>
                <div className="flex-1 border-l border-ink-100 pl-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/admin/appointments/${appointment.id}`}
                      className="font-semibold text-ink-900 hover:text-brand-700"
                    >
                      {appointment.patient?.full_name ?? "Patient"}
                    </Link>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink-600">{appointment.service?.name}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-500">
                    {appointment.location_type === "home" ? (
                      <>
                        <Home aria-hidden="true" className="size-4" />
                        {appointment.home_address}
                      </>
                    ) : (
                      <>
                        <MapPin aria-hidden="true" className="size-4" />
                        Au cabinet
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
