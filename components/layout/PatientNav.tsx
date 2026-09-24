"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarPlus, LayoutDashboard, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { cn } from "@/lib/ui";
import { initials } from "@/lib/format";

const LINKS = [
  { href: "/patient/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/patient/appointments", label: "Mes rendez-vous", icon: CalendarDays },
  { href: "/patient/appointments/new", label: "Prendre rendez-vous", icon: CalendarPlus },
  { href: "/patient/profile", label: "Mon profil", icon: UserRound },
];

export function PatientNav({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 text-sm text-ink-600 sm:flex">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
              {initials(name)}
            </span>
            {name}
          </span>
          <LogoutButton area="patient" />
        </div>
      </div>

      <nav
        aria-label="Navigation de l'espace patient"
        className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2 sm:px-6"
      >
        <ul className="flex min-w-max gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/patient/appointments"
                ? pathname === link.href || /^\/patient\/appointments\/(?!new)/.test(pathname)
                : pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-700 text-white"
                      : "text-ink-600 hover:bg-white hover:text-brand-700",
                  )}
                >
                  <link.icon aria-hidden="true" className="size-4" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
