import type { Metadata } from "next";
import { Suspense } from "react";
import { ServiceCatalogue } from "@/components/services/ServiceCatalogue";
import { Container, Section } from "@/components/ui/Layout";
import { CardSkeleton } from "@/components/ui/States";
import { getActiveServices } from "@/lib/db/services";

export const metadata: Metadata = {
  title: "Nos prestations",
  description:
    "Kinésithérapie, massages, hijama et programmes pour les patients diabétiques au cabinet DKC à Fès. Durées, tarifs et prise de rendez-vous en ligne.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getActiveServices();

  return (
    <>
      <div className="border-b border-ink-200/60 bg-gradient-to-b from-brand-50 to-cream">
        <Container className="py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-600">
            Prestations
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl font-semibold text-ink-900 sm:text-5xl">
            Toutes les prestations du cabinet
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-600">
            Durées et tarifs indiqués par le cabinet. Certaines prestations sont également proposées
            à domicile.
          </p>
        </Container>
      </div>

      <Section className="pt-10 sm:pt-14">
        <Suspense
          fallback={
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <CardSkeleton />
                </li>
              ))}
            </ul>
          }
        >
          <ServiceCatalogue services={services} />
        </Suspense>
      </Section>
    </>
  );
}
