import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarRange, Mail, Phone } from "lucide-react";
import { AdminAppointmentRow } from "@/components/admin/AdminBits";
import { PatientStatusButton } from "@/components/admin/PatientStatusButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { getAdminAppointments, getPatientById } from "@/lib/db/appointments";
import { formatDate, initials } from "@/lib/format";

export const metadata: Metadata = { title: "Fiche patient" };

export default async function AdminPatientDetailPage({ params }: PageProps<"/admin/patients/[id]">) {
  const { id } = await params;
  const patient = await getPatientById(id);
  if (!patient || patient.role !== "patient") notFound();

  const appointments = await getAdminAppointments({ patientId: patient.id }, 100);
  const completed = appointments.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/patients"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Tous les patients
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-100 font-display text-lg font-semibold text-brand-800">
          {initials(patient.full_name)}
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            {patient.full_name}
          </h1>
          <p className="text-sm text-ink-500">
            Compte créé le {formatDate(patient.created_at.slice(0, 10), "short")}
          </p>
        </div>
        {!patient.is_active && <Badge tone="neutral">Compte désactivé</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <Card>
          <CardHeader
            title="Rendez-vous"
            description={`${appointments.length} au total · ${completed} terminé${completed > 1 ? "s" : ""}`}
          />
          {appointments.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<CalendarRange aria-hidden="true" className="size-6" />}
                title="Aucun rendez-vous"
                description="Ce patient n'a pas encore réservé de séance."
              />
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {appointments.map((appointment) => (
                <AdminAppointmentRow key={appointment.id} appointment={appointment} />
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Coordonnées" />
            <dl className="space-y-4 p-5 text-sm">
              <div className="flex items-start gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-4 text-ink-400" />
                <div>
                  <dt className="text-ink-500">E-mail</dt>
                  <dd className="break-all font-medium text-ink-900">{patient.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone aria-hidden="true" className="mt-0.5 size-4 text-ink-400" />
                <div>
                  <dt className="text-ink-500">Téléphone</dt>
                  <dd className="font-medium text-ink-900">{patient.phone ?? "Non renseigné"}</dd>
                </div>
              </div>
              {patient.date_of_birth && (
                <div>
                  <dt className="text-ink-500">Date de naissance</dt>
                  <dd className="font-medium text-ink-900">
                    {formatDate(patient.date_of_birth, "short")}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Accès au compte" />
            <div className="p-5">
              <PatientStatusButton patientId={patient.id} isActive={patient.is_active} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
