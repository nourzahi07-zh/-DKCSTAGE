import Link from "next/link";
import { ArrowRight, Clock, Home, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/db/services";

/** Service card used on the homepage and the services page. Only real fields. */
export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card
      as="article"
      className="group relative flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge tone="brand">{CATEGORY_LABELS[service.category]}</Badge>
        {service.price_type === "package" && (
          <Badge tone="sand">
            {service.sessions_included ? `Forfait ${service.sessions_included} séances` : "Programme"}
          </Badge>
        )}
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">
        <Link href={`/services/${service.id}`} className="after:absolute after:inset-0">
          {service.name}
        </Link>
      </h3>
      {service.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-600">{service.description}</p>
      )}

      <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-500">
        <div className="flex items-center gap-1.5">
          <Clock aria-hidden="true" className="size-4" />
          <dt className="sr-only">Durée</dt>
          <dd>{formatDuration(service.duration_minutes)}</dd>
        </div>
        {service.at_cabinet && (
          <div className="flex items-center gap-1.5">
            <Building2 aria-hidden="true" className="size-4" />
            <dt className="sr-only">Lieu</dt>
            <dd>Cabinet</dd>
          </div>
        )}
        {service.at_home && (
          <div className="flex items-center gap-1.5">
            <Home aria-hidden="true" className="size-4" />
            <dt className="sr-only">Lieu</dt>
            <dd>Domicile</dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-ink-100 pt-4">
        <p className="font-display text-lg font-semibold text-brand-800">
          {formatPrice(service.price)}
        </p>
        <span className="relative z-10 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition-transform group-hover:translate-x-0.5">
          Détails
          <ArrowRight aria-hidden="true" className="size-4" />
        </span>
      </div>
    </Card>
  );
}
