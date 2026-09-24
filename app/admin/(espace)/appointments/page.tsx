import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { AdminAppointmentRow, AdminPageHeader } from "@/components/admin/AdminBits";
import { StatusActions } from "@/components/admin/StatusActions";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { getAdminAppointments } from "@/lib/db/appointments";
import { getAllServices } from "@/lib/db/services";
import { STATUS_LABELS, type AppointmentStatus } from "@/lib/constants";
import { isPast, todayInMorocco } from "@/lib/format";
import { cn } from "@/lib/ui";

export const metadata: Metadata = { title: "Rendez-vous" };

const STATUS_FILTERS: (AppointmentStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

function asDate(value: unknown): string | undefined {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export default async function AdminAppointmentsPage({
  searchParams,
}: PageProps<"/admin/appointments">) {
  const params = await searchParams;

  const status = STATUS_FILTERS.includes(params.statut as AppointmentStatus)
    ? (params.statut as AppointmentStatus)
    : undefined;
  const from = asDate(params.du);
  const to = asDate(params.au);
  const serviceId = typeof params.prestation === "string" ? params.prestation : undefined;

  const [appointments, services] = await Promise.all([
    getAdminAppointments({ status, from, to, serviceId }),
    getAllServices(),
  ]);

  const query = (next: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    const merged = { statut: status, du: from, au: to, prestation: serviceId, ...next };
    Object.entries(merged).forEach(([key, value]) => value && search.set(key, value));
    const qs = search.toString();
    return `/admin/appointments${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Rendez-vous"
        description="Filtrez, consultez et mettez à jour les rendez-vous du cabinet."
      />

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((value) => {
            const active = value === "all" ? !status : status === value;
            return (
              <Link
                key={value}
                href={query({ statut: value === "all" ? undefined : value })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-300",
                )}
              >
                {value === "all" ? "Tous" : STATUS_LABELS[value]}
              </Link>
            );
          })}
        </div>

        <form action="/admin/appointments" className="flex flex-wrap items-end gap-3">
          {status && <input type="hidden" name="statut" value={status} />}
          <div>
            <label htmlFor="du" className="mb-1 block text-xs font-medium text-ink-600">
              Du
            </label>
            <input
              id="du"
              name="du"
              type="date"
              defaultValue={from}
              className="rounded-lg border border-ink-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="au" className="mb-1 block text-xs font-medium text-ink-600">
              Au
            </label>
            <input
              id="au"
              name="au"
              type="date"
              defaultValue={to}
              className="rounded-lg border border-ink-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="prestation" className="mb-1 block text-xs font-medium text-ink-600">
              Prestation
            </label>
            <select
              id="prestation"
              name="prestation"
              defaultValue={serviceId ?? ""}
              className="rounded-lg border border-ink-300 px-3 py-1.5 text-sm"
            >
              <option value="">Toutes</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Filtrer
          </button>
          <Link
            href={`/admin/appointments?du=${todayInMorocco()}`}
            className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            À partir d&apos;aujourd&apos;hui
          </Link>
          {(from || to || serviceId || status) && (
            <Link
              href="/admin/appointments"
              className="text-sm font-medium text-ink-500 hover:text-brand-700"
            >
              Réinitialiser
            </Link>
          )}
        </form>
      </Card>

      <Card>
        <CardHeader
          title={`${appointments.length} rendez-vous`}
          description="Triés par date et heure."
        />
        {appointments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<CalendarRange aria-hidden="true" className="size-6" />}
              title="Aucun rendez-vous"
              description="Aucun rendez-vous ne correspond à ces filtres."
            />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {appointments.map((appointment) => (
              <AdminAppointmentRow
                key={appointment.id}
                appointment={appointment}
                actions={
                  <StatusActions
                    appointmentId={appointment.id}
                    status={appointment.status}
                    hasStarted={isPast(appointment.appointment_date, appointment.start_time)}
                  />
                }
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
