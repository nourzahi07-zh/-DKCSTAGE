import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Home, MapPin, MessageSquare, Tag } from "lucide-react";
import { CancelAppointmentButton } from "@/components/appointments/CancelAppointmentButton";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { canCancel, getAppointmentById } from "@/lib/db/appointments";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/lib/format";
import { CABINET } from "@/lib/cabinet";

export const metadata: Metadata = { title: "Détail du rendez-vous", robots: { index: false } };

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: PageProps<"/patient/appointments/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  // RLS: another patient's id simply returns nothing -> 404.
  const appointment = await getAppointmentById(id);
  if (!appointment) notFound();

  const cancellable = canCancel(appointment);

  const rows = [
    {
      icon: Tag,
      label: "Prestation",
      value: `${appointment.service?.name ?? "Prestation"}${
        appointment.service ? ` · ${formatPrice(appointment.service.price)}` : ""
      }`,
    },
    { icon: CalendarDays, label: "Date", value: formatDate(appointment.appointment_date) },
    {
      icon: Clock,
      label: "Heure",
      value: `${formatTime(appointment.start_time)} – ${formatTime(appointment.end_time)}${
        appointment.service ? ` (${formatDuration(appointment.service.duration_minutes)})` : ""
      }`,
    },
    {
      icon: appointment.location_type === "home" ? Home : MapPin,
      label: "Lieu",
      value:
        appointment.location_type === "home"
          ? `À domicile — ${appointment.home_address ?? ""}`
          : `Au cabinet — ${CABINET.address}`,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/patient/appointments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Mes rendez-vous
      </Link>

      {query.confirme === "1" && (
        <Alert tone="success">
          Votre demande de rendez-vous est enregistrée. Le cabinet la confirmera prochainement.
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink-900">
          {appointment.service?.name ?? "Rendez-vous"}
        </h1>
        <StatusBadge status={appointment.status} />
      </div>

      <Card>
        <CardHeader title="Détail de la séance" />
        <dl className="divide-y divide-ink-100">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start gap-4 p-5">
              <row.icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <div>
                <dt className="text-sm text-ink-500">{row.label}</dt>
                <dd className="font-medium text-ink-900">{row.value}</dd>
              </div>
            </div>
          ))}
          {appointment.patient_notes && (
            <div className="flex items-start gap-4 p-5">
              <MessageSquare aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <div>
                <dt className="text-sm text-ink-500">Votre message</dt>
                <dd className="font-medium text-ink-900">{appointment.patient_notes}</dd>
              </div>
            </div>
          )}
        </dl>
      </Card>

      {appointment.status === "pending" && (
        <Alert tone="info">
          Ce rendez-vous est <strong>en attente de confirmation</strong> par le cabinet. Le créneau
          vous est déjà réservé.
        </Alert>
      )}
      {appointment.status === "cancelled" && (
        <Alert tone="info">
          Ce rendez-vous a été annulé
          {appointment.cancelled_by === "admin" ? " par le cabinet." : "."} Vous pouvez en réserver
          un nouveau à tout moment.
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {cancellable ? (
          <CancelAppointmentButton appointmentId={appointment.id} />
        ) : (
          appointment.status !== "cancelled" && (
            <p className="text-sm text-ink-500">
              Ce rendez-vous ne peut plus être annulé en ligne. Contactez le cabinet si besoin.
            </p>
          )
        )}
        <ButtonLink href="/patient/appointments/new" variant="secondary">
          Prendre un autre rendez-vous
        </ButtonLink>
      </div>
    </div>
  );
}
