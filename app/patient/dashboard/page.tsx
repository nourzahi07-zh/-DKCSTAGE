import type { Metadata } from "next";
import { CalendarCheck, CalendarPlus, CalendarX, History, Mail, Phone, UserRound } from "lucide-react";
import { AppointmentCard, NextAppointmentCard } from "@/components/appointments/AppointmentCard";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { requirePatient } from "@/lib/auth/session";
import { getMyAppointments, splitAppointments } from "@/lib/db/appointments";
import { firstName } from "@/lib/format";

export const metadata: Metadata = { title: "Mon espace" };

export default async function PatientDashboardPage({ searchParams }: PageProps<"/patient/dashboard">) {
  const [profile, appointments, params] = await Promise.all([
    requirePatient(),
    getMyAppointments(),
    searchParams,
  ]);

  const { upcoming, past } = splitAppointments(appointments);
  const [next, ...otherUpcoming] = upcoming;
  const completed = past.filter((a) => a.status === "completed").length;

  const stats = [
    { label: "Rendez-vous à venir", value: upcoming.length, icon: CalendarCheck },
    { label: "Séances terminées", value: completed, icon: History },
    { label: "Annulés", value: past.filter((a) => a.status === "cancelled").length, icon: CalendarX },
  ];

  return (
    <div className="space-y-8">
      {params.password === "updated" && <Alert tone="success">Votre mot de passe a été modifié.</Alert>}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900">
            Bonjour {firstName(profile.full_name)}
          </h1>
          <p className="mt-1.5 text-ink-600">
            Retrouvez ici vos rendez-vous et gérez votre suivi au cabinet.
          </p>
        </div>
        <ButtonLink href="/patient/appointments/new">
          <CalendarPlus aria-hidden="true" className="size-4" />
          Prendre rendez-vous
        </ButtonLink>
      </header>

      {next ? (
        <NextAppointmentCard appointment={next} />
      ) : (
        <EmptyState
          icon={<CalendarPlus aria-hidden="true" className="size-6" />}
          title="Aucun rendez-vous à venir"
          description="Choisissez une prestation et un créneau disponible pour réserver votre prochaine séance."
          action={<ButtonLink href="/patient/appointments/new">Prendre rendez-vous</ButtonLink>}
        />
      )}

      <ul className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card as="li" key={stat.label} className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <stat.icon aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold text-ink-900">{stat.value}</p>
              <p className="text-sm text-ink-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <section aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="font-display text-xl font-semibold text-ink-900">
            Rendez-vous à venir
          </h2>
          {otherUpcoming.length > 0 ? (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {otherUpcoming.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white/60 p-6 text-sm text-ink-500">
              {next
                ? "Vous n'avez pas d'autre rendez-vous programmé."
                : "Vos prochains rendez-vous apparaîtront ici."}
            </p>
          )}

          {past.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold text-ink-900">Historique récent</h2>
                <ButtonLink href="/patient/appointments?filtre=passes" variant="ghost" size="sm">
                  Tout voir
                </ButtonLink>
              </div>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {past.slice(0, 2).map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </ul>
            </div>
          )}
        </section>

        <Card>
          <CardHeader
            title="Mes informations"
            action={
              <ButtonLink href="/patient/profile" variant="ghost" size="sm">
                Modifier
              </ButtonLink>
            }
          />
          <dl className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <UserRound aria-hidden="true" className="mt-0.5 size-4 text-ink-400" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-500">Nom</dt>
                <dd className="font-medium text-ink-900">{profile.full_name}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail aria-hidden="true" className="mt-0.5 size-4 text-ink-400" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-500">E-mail</dt>
                <dd className="break-all font-medium text-ink-900">{profile.email}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone aria-hidden="true" className="mt-0.5 size-4 text-ink-400" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-500">Téléphone</dt>
                <dd className="font-medium text-ink-900">{profile.phone ?? "Non renseigné"}</dd>
              </div>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
