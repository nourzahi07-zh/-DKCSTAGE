import Link from "next/link";
import {
  Activity,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Section, SectionHeading } from "@/components/ui/Layout";
import { CABINET } from "@/lib/cabinet";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import type { Service } from "@/lib/db/services";

const APPROACH = [
  {
    icon: Stethoscope,
    title: "Kinésithérapie",
    text: "Rééducation et travail du mouvement adaptés à votre situation et à vos objectifs.",
  },
  {
    icon: Activity,
    title: "Massages thérapeutiques",
    text: "Séances de détente, thérapeutiques, sportives ou drainage, à la séance ou en forfait.",
  },
  {
    icon: HeartPulse,
    title: "Accompagnement du diabète",
    text: "Programmes dédiés : mobilité, prévention des complications, soins des pieds, gestion de la douleur.",
  },
  {
    icon: ClipboardList,
    title: "Suivi personnalisé",
    text: "Vos séances sont enregistrées dans votre espace patient, du premier rendez-vous au suivi.",
  },
];

export function ApproachSection() {
  return (
    <Section tone="white">
      <Reveal>
        <SectionHeading
          eyebrow="Notre approche"
          title="Des soins pensés pour votre quotidien"
          description="Chaque prise en charge commence par un échange sur vos besoins, puis un programme adapté à votre rythme — au cabinet ou chez vous."
        />
      </Reveal>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {APPROACH.map((item, index) => (
          <Reveal as="li" key={item.title} delay={index * 0.06}>
            <Card className="h-full p-6 transition-shadow duration-300 hover:shadow-lift">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <item.icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.text}</p>
            </Card>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

export function ServicesPreview({ services }: { services: Service[] }) {
  const categories = CATEGORY_ORDER.filter((c) => services.some((s) => s.category === c));
  // One representative service per category, cheapest first for readability.
  const highlights = categories
    .map((category) =>
      services
        .filter((s) => s.category === category && s.price_type === "session")
        .sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))[0] ??
      services.find((s) => s.category === category)!,
    )
    .slice(0, 3);

  return (
    <Section id="services">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Reveal>
          <SectionHeading
            eyebrow="Nos prestations"
            title="Des soins adaptés à chaque besoin"
            description="Toutes les prestations et leurs tarifs sont tenus à jour par le cabinet."
          />
        </Reveal>
        <Reveal delay={0.1}>
          <ButtonLink href="/services" variant="secondary">
            Voir toutes les prestations
          </ButtonLink>
        </Reveal>
      </div>

      {highlights.length > 0 ? (
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((service, index) => (
            <Reveal as="li" key={service.id} delay={index * 0.06} className="relative">
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </ul>
      ) : (
        <Card className="mt-12 p-8 text-center text-ink-600">
          Les prestations seront affichées ici dès qu&apos;elles seront publiées par le cabinet.
        </Card>
      )}

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category, index) => (
          <Reveal as="li" key={category} delay={index * 0.05}>
            <Link
              href={`/services?categorie=${category}`}
              className="block h-full rounded-2xl border border-ink-200/70 bg-white/70 p-5 transition-colors hover:border-brand-300 hover:bg-white"
            >
              <p className="font-semibold text-ink-900">{CATEGORY_LABELS[category]}</p>
              <p className="mt-1.5 text-sm text-ink-600">{CATEGORY_DESCRIPTIONS[category]}</p>
            </Link>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

const ADVANTAGES = [
  {
    icon: UserRound,
    title: "Une prise en charge personnalisée",
    text: "Le programme est construit avec vous, en fonction de votre situation et de vos objectifs.",
  },
  {
    icon: HomeIcon,
    title: "Au cabinet ou à domicile",
    text: "Certaines prestations sont proposées à domicile : le lieu est indiqué sur chaque prestation.",
  },
  {
    icon: CalendarCheck,
    title: "Rendez-vous en ligne",
    text: "Vous choisissez un créneau réellement disponible ; le cabinet confirme ensuite votre venue.",
  },
  {
    icon: ClipboardList,
    title: "Un suivi centralisé",
    text: "Rendez-vous à venir, historique et annulations sont réunis dans votre espace patient.",
  },
];

export function WhyDkcSection() {
  return (
    <Section tone="white">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <SectionHeading
            eyebrow="Pourquoi DKC"
            title="Un cabinet qui simplifie votre parcours"
            description="De la prise de rendez-vous au suivi de vos séances, tout est pensé pour être simple et clair."
          />
          <div className="mt-8">
            <ButtonLink href="/patient/appointments/new">Prendre rendez-vous</ButtonLink>
          </div>
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-2">
          {ADVANTAGES.map((item, index) => (
            <Reveal as="li" key={item.title} delay={index * 0.06}>
              <Card className="h-full p-5">
                <item.icon aria-hidden="true" className="size-5 text-brand-600" />
                <h3 className="mt-4 font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.text}</p>
              </Card>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export function BookingCta() {
  return (
    <Section tone="brand">
      <Reveal>
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <SectionHeading
              tone="light"
              eyebrow="Rendez-vous"
              title="Réservez votre séance en quelques minutes"
              description="Créez votre compte patient, choisissez une prestation et un créneau disponible. Le cabinet confirme votre rendez-vous."
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink
              href="/patient/appointments/new"
              size="lg"
              className="bg-white text-brand-800 hover:bg-brand-50"
            >
              Prendre rendez-vous
            </ButtonLink>
            <ButtonLink
              href="/auth/register"
              size="lg"
              variant="secondary"
              className="border-brand-400/60 bg-transparent text-white hover:bg-brand-800"
            >
              Créer un compte
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

export function AboutPreview() {
  return (
    <Section id="a-propos">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <SectionHeading
            eyebrow="Le cabinet"
            title={`${CABINET.fullName}, à ${CABINET.city}`}
            description={`DKC est le cabinet de ${CABINET.founder}, ${CABINET.founderTitle.toLowerCase()}. Il réunit kinésithérapie, massages, hijama et programmes d'accompagnement pour les personnes diabétiques.`}
          />
          <p className="mt-6 text-ink-600">
            Les séances se déroulent au cabinet, situé en Ville Nouvelle à Fès, ou à domicile pour
            les prestations concernées.
          </p>
          <div className="mt-8">
            <ButtonLink href="/a-propos" variant="secondary">
              En savoir plus sur le cabinet
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="overflow-hidden">
            <div className="bg-brand-900 p-6 text-brand-50">
              <p className="font-display text-lg font-semibold text-white">Informations pratiques</p>
              <p className="mt-1 text-sm text-brand-100">Cabinet DKC — Fès</p>
            </div>
            <dl className="divide-y divide-ink-100">
              <div className="flex gap-4 p-5">
                <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                <div>
                  <dt className="text-sm font-semibold text-ink-900">Adresse</dt>
                  <dd className="mt-1 text-sm text-ink-600">{CABINET.address}</dd>
                </div>
              </div>
              <div className="flex gap-4 p-5">
                <HomeIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                <div>
                  <dt className="text-sm font-semibold text-ink-900">Soins à domicile</dt>
                  <dd className="mt-1 text-sm text-ink-600">
                    Proposés pour certaines prestations, indiquées sur chaque fiche.
                  </dd>
                </div>
              </div>
              <div className="flex gap-4 p-5">
                <MessageCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                <div>
                  <dt className="text-sm font-semibold text-ink-900">Horaires d&apos;ouverture</dt>
                  <dd className="mt-1 text-sm text-ink-600">
                    Les créneaux réellement disponibles s&apos;affichent lors de la prise de
                    rendez-vous.
                  </dd>
                </div>
              </div>
            </dl>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

/**
 * Contact block. Only shows details that exist in lib/cabinet.ts; the rest is
 * a clearly-marked placeholder so nothing is invented.
 */
export function ContactSection() {
  const details = [
    { label: "Téléphone", value: CABINET.phone, href: CABINET.phone ? `tel:${CABINET.phone.replace(/\s/g, "")}` : null },
    { label: "E-mail", value: CABINET.email, href: CABINET.email ? `mailto:${CABINET.email}` : null },
    { label: "WhatsApp", value: CABINET.whatsapp, href: null },
  ];

  return (
    <Section id="contact" tone="white">
      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal>
          <SectionHeading
            eyebrow="Contact"
            title="Nous trouver"
            description="Le cabinet vous accueille sur rendez-vous."
          />
          <address className="mt-8 space-y-6 not-italic">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-ink-500">Adresse</p>
              <p className="mt-1.5 text-lg text-ink-900">{CABINET.address}</p>
            </div>

            <dl className="space-y-4">
              {details.map((item) => (
                <div key={item.label}>
                  <dt className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-ink-900">
                    {item.value ? (
                      item.href ? (
                        <a href={item.href} className="font-medium text-brand-700 hover:underline">
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )
                    ) : (
                      <span className="text-ink-400">Non communiqué pour le moment</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </address>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="flex h-full flex-col justify-between p-6">
            <div>
              <h3 className="font-display text-xl font-semibold text-ink-900">
                Prendre rendez-vous en ligne
              </h3>
              <p className="mt-3 text-ink-600">
                La prise de rendez-vous se fait directement depuis votre espace patient : vous voyez
                les créneaux disponibles et recevez la confirmation du cabinet.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ink-600">
                {[
                  "Créez votre compte en une minute",
                  "Choisissez la prestation et le lieu",
                  "Sélectionnez un créneau disponible",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/patient/appointments/new">Prendre rendez-vous</ButtonLink>
              <ButtonLink href="/services" variant="secondary">
                Voir les prestations
              </ButtonLink>
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}
