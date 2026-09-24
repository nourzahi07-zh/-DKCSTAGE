import type { Metadata } from "next";
import { Building2, CalendarPlus, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container, Section } from "@/components/ui/Layout";
import { CABINET } from "@/lib/cabinet";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Adresse du cabinet DKC à Fès et prise de rendez-vous en ligne pour vos séances de kinésithérapie, massage ou accompagnement du diabète.",
  alternates: { canonical: "/contact" },
};

/** Only real, known details are shown; the rest is an explicit placeholder. */
const CHANNELS = [
  { icon: Phone, label: "Téléphone", value: CABINET.phone },
  { icon: MessageCircle, label: "WhatsApp", value: CABINET.whatsapp },
  { icon: Mail, label: "E-mail", value: CABINET.email },
];

export default function ContactPage() {
  return (
    <>
      <div className="border-b border-ink-200/60 bg-gradient-to-b from-brand-50 to-cream">
        <Container className="py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-600">Contact</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink-900 sm:text-5xl">
            Contacter le cabinet
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-600">
            Le cabinet reçoit sur rendez-vous. La réservation en ligne est le moyen le plus simple
            d&apos;obtenir une séance.
          </p>
        </Container>
      </div>

      <Section>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <Card className="h-full p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">Adresse du cabinet</h2>
              <address className="mt-6 space-y-6 not-italic">
                <div className="flex gap-4">
                  <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                  <div>
                    <p className="font-semibold text-ink-900">{CABINET.fullName}</p>
                    <p className="mt-1 text-ink-600">{CABINET.address}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Building2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                  <div>
                    <p className="font-semibold text-ink-900">Accès</p>
                    <p className="mt-1 text-ink-600">
                      Ville Nouvelle, Fès — 1<sup>er</sup> étage, bureau 3.
                    </p>
                  </div>
                </div>
              </address>

              <div className="mt-8 border-t border-ink-100 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                  Coordonnées
                </h3>
                <dl className="mt-4 space-y-4">
                  {CHANNELS.map((channel) => (
                    <div key={channel.label} className="flex items-center gap-4">
                      <channel.icon aria-hidden="true" className="size-5 shrink-0 text-brand-600" />
                      <div>
                        <dt className="text-sm text-ink-500">{channel.label}</dt>
                        <dd className="font-medium text-ink-900">
                          {channel.value ?? (
                            <span className="text-ink-400">À compléter par le cabinet</span>
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
                {!CABINET.phone && !CABINET.email && (
                  <p className="mt-6 rounded-xl border border-dashed border-ink-200 bg-cream/60 p-4 text-sm text-ink-600">
                    Les coordonnées téléphoniques et e-mail seront publiées ici dès leur
                    communication par le cabinet. En attendant, la prise de rendez-vous se fait en
                    ligne.
                  </p>
                )}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="flex h-full flex-col justify-between overflow-hidden">
              <div className="bg-brand-900 p-6 text-brand-50 sm:p-8">
                <h2 className="font-display text-xl font-semibold text-white">
                  Prendre rendez-vous
                </h2>
                <p className="mt-3 text-brand-100">
                  Choisissez une prestation, un lieu et un créneau réellement disponible. Vous
                  recevez la confirmation du cabinet dans votre espace patient.
                </p>
              </div>
              <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                <ol className="space-y-4 text-sm text-ink-600">
                  {[
                    "Créez votre compte patient (une minute).",
                    "Sélectionnez la prestation et le lieu de la séance.",
                    "Choisissez la date et l'heure parmi les créneaux libres.",
                    "Le cabinet confirme votre rendez-vous.",
                  ].map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/patient/appointments/new" size="lg">
                    <CalendarPlus aria-hidden="true" className="size-5" />
                    Prendre rendez-vous
                  </ButtonLink>
                  <ButtonLink href="/services" variant="secondary" size="lg">
                    Voir les prestations
                  </ButtonLink>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
