import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { LOCATION_LABELS } from "@/lib/constants";
import { formatDateCompact, formatTime, initials } from "@/lib/format";
import type { AppointmentWithPatient } from "@/lib/db/appointments";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-ink-600">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({
  label,
  value,
  icon,
  href,
  tone = "default",
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  href?: string;
  tone?: "default" | "attention";
}) {
  const content = (
    <Card
      className={`flex items-center gap-4 p-5 transition-all ${
        href ? "hover:-translate-y-0.5 hover:shadow-lift" : ""
      } ${tone === "attention" ? "border-sand-300 bg-sand-50/60" : ""}`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
          tone === "attention" ? "bg-sand-200 text-sand-800" : "bg-brand-50 text-brand-700"
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="font-display text-2xl font-semibold text-ink-900">{value}</p>
        <p className="text-sm text-ink-500">{label}</p>
      </div>
    </Card>
  );

  return href ? (
    <li>
      <Link href={href} className="block">
        {content}
      </Link>
    </li>
  ) : (
    <li>{content}</li>
  );
}

/** One appointment row, used by the dashboard, the planning and the list. */
export function AdminAppointmentRow({
  appointment,
  showDate = true,
  actions,
}: {
  appointment: AppointmentWithPatient;
  showDate?: boolean;
  actions?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="flex min-w-[9rem] items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
          {initials(appointment.patient?.full_name ?? "?")}
        </span>
        <div>
          <p className="font-semibold text-ink-900">
            <Link href={`/admin/appointments/${appointment.id}`} className="hover:text-brand-700">
              {appointment.patient?.full_name ?? "Patient"}
            </Link>
          </p>
          {appointment.patient?.phone && (
            <a
              href={`tel:${appointment.patient.phone}`}
              className="text-xs text-ink-500 hover:text-brand-700"
            >
              {appointment.patient.phone}
            </a>
          )}
        </div>
      </div>

      <div className="min-w-[8rem] flex-1">
        <p className="text-sm font-medium text-ink-900">{appointment.service?.name ?? "—"}</p>
        <p className="text-xs text-ink-500">{LOCATION_LABELS[appointment.location_type]}</p>
      </div>

      <div className="min-w-[7rem]">
        <p className="text-sm font-medium text-ink-900">
          {showDate && `${formatDateCompact(appointment.appointment_date)} · `}
          {formatTime(appointment.start_time)}
        </p>
        <p className="text-xs text-ink-500">
          jusqu&apos;à {formatTime(appointment.end_time)}
        </p>
      </div>

      <StatusBadge status={appointment.status} />

      {actions && <div className="ml-auto">{actions}</div>}
    </li>
  );
}
