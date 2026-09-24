import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/States";
import { requirePatient } from "@/lib/auth/session";
import { getActiveServices } from "@/lib/db/services";
import { getMyAppointments, splitAppointments } from "@/lib/db/appointments";
import { BOOKING_NOTICE_HOURS } from "@/lib/constants";

export const metadata: Metadata = { title: "Prendre rendez-vous", robots: { index: false } };

export default async function NewAppointmentPage({
  searchParams,
}: PageProps<"/patient/appointments/new">) {
  await requirePatient();
  const [services, appointments, params] = await Promise.all([
    getActiveServices(),
    getMyAppointments(),
    searchParams,
  ]);

  const preselected = typeof params.service === "string" ? params.service : undefined;
  const { upcoming } = splitAppointments(appointments);
  const atLimit = upcoming.filter((a) => a.status === "pending" || a.status === "confirmed").length >= 10;

  // Reuse the address of a previous home visit, so it doesn't have to be retyped.
  const lastHomeAddress = appointments.find((a) => a.location_type === "home")?.home_address ?? "";

  return (
    <div className="space-y-6">
      <Link
        href="/patient/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Tableau de bord
      </Link>

      <header>
        <h1 className="font-display text-3xl font-semibold text-ink-900">Prendre rendez-vous</h1>
        <p className="mt-1.5 text-ink-600">
          Choisissez votre prestation, le lieu et un créneau disponible. Réservation possible
          jusqu&apos;à {BOOKING_NOTICE_HOURS} heures avant la séance.
        </p>
      </header>

      {atLimit ? (
        <Alert tone="error">
          Vous avez atteint le nombre maximum de rendez-vous à venir (10). Annulez un rendez-vous
          existant pour pouvoir en réserver un nouveau.
        </Alert>
      ) : services.length === 0 ? (
        <EmptyState
          title="Aucune prestation disponible"
          description="Le cabinet n'a pas encore publié de prestation réservable en ligne."
        />
      ) : (
        <BookingWizard
          services={services}
          preselectedServiceId={services.some((s) => s.id === preselected) ? preselected : undefined}
          defaultAddress={lastHomeAddress}
        />
      )}
    </div>
  );
}
