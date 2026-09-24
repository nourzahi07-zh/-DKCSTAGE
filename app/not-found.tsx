import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-16">
      <div className="max-w-md text-center">
        <p className="font-display text-6xl font-semibold text-brand-700">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">
          Cette page n&apos;existe pas
        </h1>
        <p className="mt-3 text-ink-600">
          Le lien est peut-être erroné ou la page a été déplacée.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>
          <ButtonLink href="/services" variant="secondary">
            Voir les prestations
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm text-ink-500">
          Besoin d&apos;un rendez-vous ?{" "}
          <Link href="/patient/appointments/new" className="font-semibold text-brand-700 hover:underline">
            Prendre rendez-vous
          </Link>
        </p>
      </div>
    </main>
  );
}
