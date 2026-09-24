import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CalendarClock, CalendarDays, CheckCheck, Clock, Users } from "lucide-react";
import { AdminAppointmentRow, AdminPageHeader, StatCard } from "@/components/admin/AdminBits";
import { StatusActions } from "@/components/admin/StatusActions";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminAppointments, getAdminStats } from "@/lib/db/appointments";
import { formatDate, isPast, todayInMorocco } from "@/lib/format";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function AdminDashboardPage({ searchParams }: PageProps<"/admin/dashboard">) {
  const today = todayInMorocco();
  const [profile, stats, todayAppointments, pending, params] = await Promise.all([
    requireAdmin(),
    getAdminStats(),
    getAdminAppointments({ from: today, to: today }),
    getAdminAppointments({ status: "pending", from: today }),
    searchParams,
  ]);

  const activeToday = todayAppointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed",
  );

  return (
    <div className="space-y-8">
      {params.password === "updated" && <Alert tone="success">Votre mot de passe a été modifié.</Alert>}

      <AdminPageHeader
        title={`Bonjour ${profile.full_name.split(" ")[0]}`}
        description={`Nous sommes le ${formatDate(today)}.`}
        action={
          <ButtonLink href="/admin/planning" variant="secondary">
            <CalendarClock aria-hidden="true" className="size-4" />
            Voir le planning
          </ButtonLink>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Séances aujourd'hui"
          value={stats.today}
          icon={<CalendarDays aria-hidden="true" className="size-5" />}
          href="/admin/planning"
        />
        <StatCard
          label="Demandes en attente"
          value={stats.pending}
          icon={<Clock aria-hidden="true" className="size-5" />}
          href="/admin/appointments?statut=pending"
          tone={stats.pending > 0 ? "attention" : "default"}
        />
        <StatCard
          label="Rendez-vous à venir"
          value={stats.upcoming}
          icon={<CalendarCheck aria-hidden="true" className="size-5" />}
          href="/admin/appointments"
        />
        <StatCard
          label="Rendez-vous confirmés"
          value={stats.confirmed}
          icon={<CalendarCheck aria-hidden="true" className="size-5" />}
          href="/admin/appointments?statut=confirmed"
        />
        <StatCard
          label="Séances terminées"
          value={stats.completed}
          icon={<CheckCheck aria-hidden="true" className="size-5" />}
          href="/admin/appointments?statut=completed"
        />
        <StatCard
          label="Patients inscrits"
          value={stats.patients}
          icon={<Users aria-hidden="true" className="size-5" />}
          href="/admin/patients"
        />
      </ul>

      <section aria-labelledby="today-title">
        <Card>
          <CardHeader
            title="Séances du jour"
            description={`${activeToday.length} rendez-vous actif${activeToday.length > 1 ? "s" : ""}`}
            action={
              <Link
                href="/admin/planning"
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                Planning complet
              </Link>
            }
          />
          <h2 id="today-title" className="sr-only">
            Séances du jour
          </h2>
          {activeToday.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<CalendarDays aria-hidden="true" className="size-6" />}
                title="Aucune séance aujourd'hui"
                description="Les rendez-vous confirmés et en attente du jour apparaîtront ici."
              />
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {activeToday.map((appointment) => (
                <AdminAppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  showDate={false}
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
      </section>

      <section aria-labelledby="pending-title">
        <Card>
          <CardHeader
            title="Demandes à confirmer"
            description="Rendez-vous demandés par des patients, en attente de votre validation."
          />
          <h2 id="pending-title" className="sr-only">
            Demandes à confirmer
          </h2>
          {pending.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Aucune demande en attente" description="Tout est à jour." />
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {pending.slice(0, 8).map((appointment) => (
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
      </section>
    </div>
  );
}
