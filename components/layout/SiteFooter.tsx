import Link from "next/link";
import { MapPin } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Layout";
import { CABINET } from "@/lib/cabinet";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-200/70 bg-white">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-display text-lg font-semibold text-ink-900">DKC</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-ink-600">
              Cabinet de kinésithérapie et d&apos;accompagnement des patients diabétiques à Fès.
              Soins au cabinet et à domicile.
            </p>
          </div>

          <nav aria-label="Navigation du pied de page">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-900">
              Navigation
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-600">
              <li><Link href="/" className="hover:text-brand-700">Accueil</Link></li>
              <li><Link href="/a-propos" className="hover:text-brand-700">À propos</Link></li>
              <li><Link href="/services" className="hover:text-brand-700">Services</Link></li>
              <li><Link href="/contact" className="hover:text-brand-700">Contact</Link></li>
              <li><Link href="/patient/appointments/new" className="hover:text-brand-700">Prendre rendez-vous</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-900">
              Prestations
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-600">
              {CATEGORY_ORDER.map((category) => (
                <li key={category}>
                  <Link href={`/services?categorie=${category}`} className="hover:text-brand-700">
                    {CATEGORY_LABELS[category]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-900">
              Le cabinet
            </h2>
            <address className="mt-4 space-y-3 text-sm not-italic text-ink-600">
              <p className="flex gap-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <span>{CABINET.address}</span>
              </p>
              {CABINET.phone && (
                <p>
                  <a href={`tel:${CABINET.phone.replace(/\s/g, "")}`} className="hover:text-brand-700">
                    {CABINET.phone}
                  </a>
                </p>
              )}
              {CABINET.email && (
                <p>
                  <a href={`mailto:${CABINET.email}`} className="hover:text-brand-700">
                    {CABINET.email}
                  </a>
                </p>
              )}
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-100 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} DKC — Diabète Kiné Care. Tous droits réservés.</p>
          <p>
            Les informations présentées sur ce site sont fournies à titre informatif et ne
            remplacent pas une consultation professionnelle.
          </p>
        </div>
      </Container>
    </footer>
  );
}
