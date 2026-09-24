import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Home, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDate, formatDuration, formatTime } from "@/lib/format";
import type { AppointmentWithService } from "@/lib/db/appointments";

/** Patient-facing appointment summary. */
export function AppointmentCard({
  appointment,
  highlight = false,
}: {
  appointment: AppointmentWithService;
  highlight?: boolean;
}) {
  return (
    <Card
      as="li"
      className={`group relative p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift ${
        highlight ? "border-brand-300 ring-1 ring-brand-200" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink-900">
            <Link href={`/patient/appointments/${appointment.id}`} className="after:absolute after:inset-0">
              {appointment.service?.name ?? "Prestation"}
            </Link>
          </h3>
          <p className="mt-1 text-sm capitalize text-ink-600">
            {formatDate(appointment.appointment_date)}
          </p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
        <div className="flex items-center gap-1.5">
          <Clock aria-hidden="true" className="size-4 text-ink-400" />
          <dt className="sr-only">Heure</dt>
          <dd>
            {formatTime(appointment.start_time)}
            {appointment.service && ` · ${formatDuration(appointment.service.duration_minutes)}`}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          {appointment.location_type === "home" ? (
            <Home aria-hidden="true" className="size-4 text-ink-400" />
          ) : (
            <MapPin aria-hidden="true" className="size-4 text-ink-400" />
          )}
          <dt className="sr-only">Lieu</dt>
          <dd>{appointment.location_type === "home" ? "À domicile" : "Au cabinet"}</dd>
        </div>
      </dl>

      <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition-transform group-hover:translate-x-0.5">
        Voir le détail
        <ArrowRight aria-hidden="true" className="size-4" />
      </p>
    </Card>
  );
}

/** Compact next-appointment banner for the dashboard. */
export function NextAppointmentCard({ appointment }: { appointment: AppointmentWithService }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-900 px-6 py-4 text-brand-50">
        <div className="flex items-center gap-2.5">
          <CalendarDays aria-hidden="true" className="size-5" />
          <p className="font-semibold text-white">Votre prochain rendez-vous</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <p className="font-display text-2xl font-semibold text-ink-900">
            {appointment.service?.name ?? "Prestation"}
          </p>
          <p className="mt-2 capitalize text-ink-600">
            {formatDate(appointment.appointment_date)} à {formatTime(appointment.start_time)}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {appointment.location_type === "home"
              ? `À domicile — ${appointment.home_address ?? ""}`
              : "Au cabinet, Fès"}
          </p>
        </div>
        <Link
          href={`/patient/appointments/${appointment.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          Gérer ce rendez-vous
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </Card>
  );
}
