import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, CalendarRange } from "lucide-react";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { getMyAppointments, splitAppointments } from "@/lib/db/appointments";
import { cn } from "@/lib/ui";

export const metadata: Metadata = { title: "Mes rendez-vous" };

const FILTERS = [
  { key: "avenir", label: "À venir" },
  { key: "passes", label: "Historique" },
  { key: "tous", label: "Tous" },
] as const;

export default async function PatientAppointmentsPage({
  searchParams,
}: PageProps<"/patient/appointments">) {
  const [appointments, params] = await Promise.all([getMyAppointments(), searchParams]);
  const { upcoming, past } = splitAppointments(appointments);

  const filter = FILTERS.some((f) => f.key === params.filtre)
    ? (params.filtre as (typeof FILTERS)[number]["key"])
    : "avenir";
  const visible = filter === "avenir" ? upcoming : filter === "passes" ? past : [...upcoming, ...past];

  const counts = { avenir: upcoming.length, passes: past.length, tous: appointments.length };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900">Mes rendez-vous</h1>
          <p className="mt-1.5 text-ink-600">Vos séances passées et à venir au cabinet DKC.</p>
        </div>
        <ButtonLink href="/patient/appointments/new">
          <CalendarPlus aria-hidden="true" className="size-4" />
          Prendre rendez-vous
        </ButtonLink>
      </header>

      <nav aria-label="Filtrer les rendez-vous">
        <ul className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <li key={item.key}>
              <Link
                href={`/patient/appointments?filtre=${item.key}`}
                aria-current={filter === item.key ? "page" : undefined}
                className={cn(
                  "inline-block rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  filter === item.key
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700",
                )}
              >
                {item.label} ({counts[item.key]})
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {visible.length === 0 ? (
        <EmptyState
          icon={<CalendarRange aria-hidden="true" className="size-6" />}
          title={
            filter === "passes" ? "Aucun rendez-vous passé" : "Aucun rendez-vous à venir"
          }
          description={
            filter === "passes"
              ? "Vos séances terminées ou annulées apparaîtront ici."
              : "Réservez votre prochaine séance en quelques clics."
          }
          action={
            filter !== "passes" && (
              <ButtonLink href="/patient/appointments/new">Prendre rendez-vous</ButtonLink>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </ul>
      )}
    </div>
  );
}
