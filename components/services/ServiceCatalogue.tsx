"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SearchX } from "lucide-react";
import { ServiceCard } from "@/components/services/ServiceCard";
import { EmptyState } from "@/components/ui/States";
import { CATEGORY_LABELS, CATEGORY_ORDER, type ServiceCategory } from "@/lib/constants";
import { cn } from "@/lib/ui";
import type { Service } from "@/lib/db/services";

/**
 * Category filter over the services already fetched on the server.
 * The catalogue is small, so filtering client-side avoids a round trip; the
 * chosen category is kept in the URL so the view can be shared.
 */
export function ServiceCatalogue({ services }: { services: Service[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const reduced = useReducedMotion();

  const raw = params.get("categorie");
  const active = CATEGORY_ORDER.includes(raw as ServiceCategory) ? (raw as ServiceCategory) : null;
  const available = CATEGORY_ORDER.filter((c) => services.some((s) => s.category === c));
  const visible = active ? services.filter((s) => s.category === active) : services;

  function select(category: ServiceCategory | null) {
    router.replace(category ? `/services?categorie=${category}` : "/services", { scroll: false });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
        <FilterChip active={active === null} onClick={() => select(null)}>
          Toutes ({services.length})
        </FilterChip>
        {available.map((category) => (
          <FilterChip key={category} active={active === category} onClick={() => select(category)}>
            {CATEGORY_LABELS[category]} ({services.filter((s) => s.category === category).length})
          </FilterChip>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<SearchX aria-hidden="true" className="size-6" />}
            title="Aucune prestation dans cette catégorie"
            description="Choisissez une autre catégorie pour voir les prestations disponibles."
          />
        </div>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((service, index) => (
              <motion.li
                key={service.id}
                layout={!reduced}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, delay: reduced ? 0 : Math.min(index * 0.03, 0.2) }}
                className="relative list-none"
              >
                <ServiceCard service={service} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
        active
          ? "border-brand-700 bg-brand-700 text-white shadow-card"
          : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700",
      )}
    >
      {children}
    </button>
  );
}
