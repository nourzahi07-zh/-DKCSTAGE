"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarPlus, LayoutDashboard, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/ui";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "À propos" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

/**
 * Public navigation. `session` is decided on the server (see the public
 * layout) so a logged-in patient sees their space instead of "Connexion".
 */
export function SiteHeader({ session }: { session: { role: "patient" | "admin"; name: string } | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    // Deferred so the first paint isn't blocked by a synchronous state update.
    const timer = window.setTimeout(onScroll, 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Prevent the page behind the mobile panel from scrolling.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const spaceHref = session?.role === "admin" ? "/admin/dashboard" : "/patient/dashboard";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled || open
          ? "border-ink-200/70 bg-cream/90 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-white text-brand-800 shadow-card" : "text-ink-600 hover:text-brand-700",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {session ? (
            <ButtonLink href={spaceHref} variant="secondary" size="sm">
              <LayoutDashboard aria-hidden="true" className="size-4" />
              Mon espace
            </ButtonLink>
          ) : (
            <ButtonLink href="/auth/login" variant="ghost" size="sm">
              Connexion
            </ButtonLink>
          )}
          <ButtonLink href="/patient/appointments/new" size="sm">
            <CalendarPlus aria-hidden="true" className="size-4" />
            Prendre rendez-vous
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="inline-flex size-11 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-800 lg:hidden"
        >
          {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-mobile"
            initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-ink-200/70 bg-cream lg:hidden"
          >
            <nav aria-label="Navigation mobile" className="space-y-1 px-4 py-4 sm:px-6">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-ink-800 hover:bg-white"
                >
                  {link.label}
                </Link>
              ))}
              <div className="grid gap-2 pt-3">
                {session ? (
                  <ButtonLink href={spaceHref} variant="secondary">
                    <LayoutDashboard aria-hidden="true" className="size-4" />
                    Mon espace ({session.name})
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/auth/login" variant="secondary">
                    Connexion
                  </ButtonLink>
                )}
                <ButtonLink href="/patient/appointments/new">
                  <CalendarPlus aria-hidden="true" className="size-4" />
                  Prendre rendez-vous
                </ButtonLink>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
