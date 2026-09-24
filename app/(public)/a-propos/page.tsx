import type { Metadata } from "next";
import { HeartPulse, MapPin, Stethoscope, Users } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container, Section, SectionHeading } from "@/components/ui/Layout";
import { CABINET } from "@/lib/cabinet";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "À propos du cabinet",
  description:
    "DKC — Diabète Kiné Care, le cabinet de kinésithérapie de Rihab à Fès : kinésithérapie, massages, hijama et accompagnement des patients diabétiques.",
  alternates: { canonical: "/a-propos" },
};

export default function AboutPage() {
  return (
    <>
      <div className="border-b border-ink-200/60 bg-gradient-to-b from-brand-50 to-cream">
        <Container className="py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-600">
            Le cabinet
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-ink-900 sm:text-5xl">
            {CABINET.fullName}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-600">
            Un cabinet de kinésithérapie à {CABINET.city}, dédié au mouvement, à la récupération et
            à l&apos;accompagnement des personnes diabétiques.
          </p>
        </Container>
      </div>

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <SectionHeading eyebrow="Notre mission" title="Prendre soin, simplement" />
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-600">
              <p>
                DKC réunit les soins de kinésithérapie, les massages thérapeutiques et un
                accompagnement spécifique pour les personnes vivant avec un diabète. Chaque prise en
                charge commence par un temps d&apos;écoute, puis un programme adapté à votre
                situation.
              </p>
              <p>
                Le cabinet est dirigé par {CABINET.founder}, {CABINET.founderTitle.toLowerCase()}.
                Les séances ont lieu au cabinet, en Ville Nouvelle à Fès, ou à domicile pour les
                prestations concernées.
              </p>
            </div>

            {/* Clearly marked placeholder - no biography is invented. */}
            <Card className="mt-8 border-dashed bg-cream/60 p-5">
              <p className="text-sm font-semibold text-ink-900">Présentation détaillée</p>
              <p className="mt-1.5 text-sm text-ink-600">
                Cet espace est prévu pour la présentation de {CABINET.founder} (parcours, diplômes,
                spécialités) ainsi que des photos du cabinet. Il sera complété dès que ces
                informations seront fournies.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">Nos domaines</h2>
              <ul className="mt-6 space-y-5">
                {CATEGORY_ORDER.map((category) => (
                  <li key={category} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      {category === "diabetes_care" ? (
                        <HeartPulse aria-hidden="true" className="size-5" />
                      ) : (
                        <Stethoscope aria-hidden="true" className="size-5" />
                      )}
                    </span>
                    <div>
                      <p className="font-semibold text-ink-900">{CATEGORY_LABELS[category]}</p>
                      <p className="mt-1 text-sm text-ink-600">{CATEGORY_DESCRIPTIONS[category]}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </Section>

      <Section>
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Informations pratiques"
            title="Où et comment se déroulent les séances"
          />
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: MapPin,
              title: "Au cabinet",
              text: CABINET.address,
            },
            {
              icon: Users,
              title: "À domicile",
              text: "Proposé pour certaines prestations. L'adresse est demandée lors de la réservation.",
            },
            {
              icon: Stethoscope,
              title: "Sur rendez-vous",
              text: "Les créneaux disponibles s'affichent en ligne ; le cabinet confirme chaque demande.",
            },
          ].map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <Card className="h-full p-6">
                <item.icon aria-hidden="true" className="size-5 text-brand-600" />
                <h3 className="mt-4 font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href="/patient/appointments/new" size="lg">
              Prendre rendez-vous
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Contacter le cabinet
            </ButtonLink>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
