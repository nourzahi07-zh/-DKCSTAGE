import { CalendarPlus, Home, MapPin, ShieldCheck } from "lucide-react";
import { Rise } from "@/components/motion/Rise";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";
import { CABINET } from "@/lib/cabinet";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft brand backdrop - pure CSS, no image dependency. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 via-cream to-cream" />
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -left-20 top-40 size-72 rounded-full bg-sand-200/40 blur-3xl" />
      </div>

      <Container className="py-16 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Rise>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-sm font-medium text-brand-800">
                <MapPin aria-hidden="true" className="size-4" />
                Cabinet à Fès · Soins à domicile
              </span>
            </Rise>

            <Rise delay={0.08}>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.1] text-ink-900 sm:text-5xl lg:text-6xl">
                Votre mobilité et votre santé,{" "}
                <span className="text-brand-700">accompagnées pas à pas</span>
              </h1>
            </Rise>

            <Rise delay={0.16}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
                DKC — Diabète Kiné Care est le cabinet de {CABINET.founder},{" "}
                {CABINET.founderTitle.toLowerCase()} à Fès. Kinésithérapie, massages et programmes
                dédiés aux personnes diabétiques, au cabinet ou à domicile, avec un suivi
                personnalisé à chaque séance.
              </p>
            </Rise>

            <Rise delay={0.24}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/patient/appointments/new" size="lg">
                  <CalendarPlus aria-hidden="true" className="size-5" />
                  Prendre rendez-vous
                </ButtonLink>
                <ButtonLink href="/services" variant="secondary" size="lg">
                  Découvrir nos services
                </ButtonLink>
              </div>
            </Rise>

            <Rise delay={0.32}>
              <dl className="mt-12 grid max-w-lg grid-cols-2 gap-6 border-t border-ink-200/70 pt-8 sm:grid-cols-3">
                {[
                  { icon: Home, term: "À domicile", detail: "Pour les prestations concernées" },
                  { icon: CalendarPlus, term: "En ligne", detail: "Réservation en quelques clics" },
                  { icon: ShieldCheck, term: "Suivi", detail: "Historique de vos séances" },
                ].map(({ icon: Icon, term, detail }) => (
                  <div key={term}>
                    <Icon aria-hidden="true" className="size-5 text-brand-600" />
                    <dt className="mt-2 text-sm font-semibold text-ink-900">{term}</dt>
                    <dd className="text-sm text-ink-500">{detail}</dd>
                  </div>
                ))}
              </dl>
            </Rise>
          </div>

          <Rise delay={0.2} className="relative">
            {/* Abstract "care" composition: no stock photo, no invented claim. */}
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-brand-700 to-brand-900" />
              <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
              <div className="absolute inset-x-6 bottom-6 rounded-3xl bg-white/95 p-6 shadow-lift backdrop-blur">
                <p className="font-display text-lg font-semibold text-ink-900">
                  Un parcours de soin clair
                </p>
                <ol className="mt-4 space-y-3 text-sm text-ink-600">
                  {[
                    "Choisissez votre prestation",
                    "Sélectionnez un créneau disponible",
                    "Recevez la confirmation du cabinet",
                  ].map((step, index) => (
                    <li key={step} className="flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Rise>
        </div>
      </Container>
    </section>
  );
}
