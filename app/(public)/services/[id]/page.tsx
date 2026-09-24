import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarPlus, Clock, Home, Tag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Layout";
import { ServiceCard } from "@/components/services/ServiceCard";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from "@/lib/constants";
import { formatDuration, formatPrice } from "@/lib/format";
import { getActiveServiceById, getActiveServices } from "@/lib/db/services";

export async function generateMetadata({ params }: PageProps<"/services/[id]">): Promise<Metadata> {
  const { id } = await params;
  const service = await getActiveServiceById(id);
  if (!service) return { title: "Prestation introuvable" };

  return {
    title: service.name,
    description:
      service.description ||
      `${service.name} au cabinet DKC à Fès — ${formatDuration(service.duration_minutes)}.`,
    alternates: { canonical: `/services/${service.id}` },
  };
}

export default async function ServiceDetailPage({ params }: PageProps<"/services/[id]">) {
  const { id } = await params;
  const service = await getActiveServiceById(id);
  if (!service) notFound();

  const others = (await getActiveServices())
    .filter((s) => s.category === service.category && s.id !== service.id)
    .slice(0, 3);

  const facts = [
    { icon: Clock, label: "Durée", value: formatDuration(service.duration_minutes) },
    { icon: Tag, label: "Tarif", value: formatPrice(service.price) },
    {
      icon: service.at_home ? Home : Building2,
      label: "Lieu",
      value: [service.at_cabinet && "Au cabinet", service.at_home && "À domicile"]
        .filter(Boolean)
        .join(" · "),
    },
  ];

  return (
    <>
      <div className="border-b border-ink-200/60 bg-gradient-to-b from-brand-50 to-cream">
        <Container className="py-12 sm:py-16">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Toutes les prestations
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge tone="brand">{CATEGORY_LABELS[service.category]}</Badge>
            {service.price_type === "package" && (
              <Badge tone="sand">
                {service.sessions_included
                  ? `Forfait ${service.sessions_included} séances`
                  : "Programme"}
              </Badge>
            )}
          </div>

          <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-ink-900 sm:text-5xl">
            {service.name}
          </h1>
          {service.description && (
            <p className="mt-5 max-w-2xl text-lg text-ink-600">{service.description}</p>
          )}
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-8">
            <Card className="p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">
                En quelques mots
              </h2>
              <p className="mt-3 text-ink-600">{CATEGORY_DESCRIPTIONS[service.category]}</p>
              {service.price_type === "package" && (
                <p className="mt-4 rounded-xl bg-sand-50 p-4 text-sm text-sand-900">
                  {service.sessions_included
                    ? `Ce forfait comprend ${service.sessions_included} séances. Les séances se réservent une par une depuis votre espace patient.`
                    : "Ce programme est constitué de plusieurs séances, réservées une par une depuis votre espace patient."}
                </p>
              )}
              <p className="mt-4 text-sm text-ink-500">
                Le déroulé précis de la séance est défini avec le cabinet lors de votre venue.
              </p>
            </Card>

            {others.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold text-ink-900">
                  Autres prestations {CATEGORY_LABELS[service.category].toLowerCase()}
                </h2>
                <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                  {others.map((other) => (
                    <li key={other.id}>
                      <ServiceCard service={other} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6">
              <dl className="space-y-4">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-start gap-3">
                    <fact.icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                    <div>
                      <dt className="text-sm text-ink-500">{fact.label}</dt>
                      <dd className="font-semibold text-ink-900">{fact.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-6 border-t border-ink-100 pt-6">
                <ButtonLink
                  href={`/patient/appointments/new?service=${service.id}`}
                  className="w-full"
                  size="lg"
                >
                  <CalendarPlus aria-hidden="true" className="size-5" />
                  Prendre rendez-vous
                </ButtonLink>
                <p className="mt-3 text-center text-xs text-ink-500">
                  Connexion requise. Le cabinet confirme ensuite votre rendez-vous.
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}
