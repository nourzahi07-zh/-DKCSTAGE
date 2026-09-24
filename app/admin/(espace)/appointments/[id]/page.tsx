import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Home, Mail, MapPin, MessageSquare, Phone, Tag, User } from "lucide-react";
import { StatusActions } from "@/components/admin/StatusActions";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { getAdminAppointmentById } from "@/lib/db/appointments";
import { formatDate, formatDuration, formatPrice, formatTime, isPast } from "@/lib/format";

export const metadata: Metadata = { title: "Détail du rendez-vous" };

export default async function AdminAppointmentDetailPage({
  params,
}: PageProps<"/admin/appointments/[id]">) {
  const { id } = await params;
  const appointment = await getAdminAppointmentById(id);
  if (!appointment) notFound();

  const details = [
    {
      icon: Tag,
      label: "Prestation",
      value: `${appointment.service?.name ?? "—"}${
        appointment.service ? ` · ${formatPrice(appointment.service.price)}` : ""
      }`,
    },
    { icon: CalendarDays, label: "Date", value: formatDate(appointment.appointment_date) },
    {
      icon: Clock,
      label: "Horaire",
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
          : "Au cabinet",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/appointments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Tous les rendez-vous
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          {appointment.patient?.full_name ?? "Patient"}
        </h1>
        <StatusBadge status={appointment.status} />
      </div>

      <Card>
        <CardHeader title="Séance" />
        <dl className="divide-y divide-ink-100">
          {details.map((row) => (
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
                <dt className="text-sm text-ink-500">Message du patient</dt>
                <dd className="font-medium text-ink-900">{appointment.patient_notes}</dd>
              </div>
            </div>
          )}
        </dl>
      </Card>

      <Card>
        <CardHeader title="Patient" />
        <dl className="divide-y divide-ink-100">
          <div className="flex items-start gap-4 p-5">
            <User aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
            <div>
              <dt className="text-sm text-ink-500">Nom</dt>
              <dd className="font-medium text-ink-900">
                {appointment.patient ? (
                  <Link
                    href={`/admin/patients/${appointment.patient.id}`}
                    className="hover:text-brand-700"
                  >
                    {appointment.patient.full_name}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5">
            <Phone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
            <div>
              <dt className="text-sm text-ink-500">Téléphone</dt>
              <dd className="font-medium text-ink-900">
                {appointment.patient?.phone ? (
                  <a href={`tel:${appointment.patient.phone}`} className="hover:text-brand-700">
                    {appointment.patient.phone}
                  </a>
                ) : (
                  "Non renseigné"
                )}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5">
            <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
            <div>
              <dt className="text-sm text-ink-500">E-mail</dt>
              <dd className="break-all font-medium text-ink-900">
                {appointment.patient?.email ?? "—"}
              </dd>
            </div>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader title="Actions" description="Les transitions non autorisées sont refusées par la base de données." />
        <div className="p-5">
          <StatusActions
            appointmentId={appointment.id}
            status={appointment.status}
            hasStarted={isPast(appointment.appointment_date, appointment.start_time)}
            size="md"
          />
          {(appointment.status === "completed" || appointment.status === "cancelled") && (
            <p className="text-sm text-ink-500">
              Ce rendez-vous est {appointment.status === "completed" ? "terminé" : "annulé"} : aucune
              action n&apos;est possible.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
