"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarClock,
  CalendarRange,
  LayoutDashboard,
  Menu,
  Settings,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/ui";

const LINKS = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/planning", label: "Planning du jour", icon: CalendarClock },
  { href: "/admin/appointments", label: "Rendez-vous", icon: CalendarRange },
  { href: "/admin/patients", label: "Patients", icon: Users },
  { href: "/admin/services", label: "Prestations", icon: Stethoscope },
  { href: "/admin/availability", label: "Disponibilités", icon: CalendarClock },
  { href: "/admin/account", label: "Mon compte", icon: Settings },
];

/** Dark operational sidebar (desktop) / slide-down menu (mobile). */
export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <ul className="space-y-1">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-700 text-white"
                  : "text-brand-100/80 hover:bg-brand-800/70 hover:text-white",
              )}
            >
              <link.icon aria-hidden="true" className="size-4" />
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-ink-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-900 p-5 lg:flex">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="leading-tight">
            <span className="block font-display text-base font-semibold text-white">DKC</span>
            <span className="block text-[11px] uppercase tracking-wider text-brand-200">
              Administration
            </span>
          </span>
        </Link>

        <nav aria-label="Navigation administration" className="mt-8 flex-1">
          {nav}
        </nav>

        <div className="border-t border-brand-800 pt-4">
          <p className="px-3 text-xs text-brand-200">Connectée en tant que</p>
          <p className="px-3 text-sm font-medium text-white">{name}</p>
          <div className="mt-2 [&_button]:text-brand-100 [&_button]:hover:bg-brand-800">
            <LogoutButton area="admin" />
          </div>
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-3 bg-brand-900 px-4 py-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <LogoMark className="size-8" />
            <span className="font-display text-base font-semibold text-white">DKC Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="admin-menu"
            className="inline-flex size-10 items-center justify-center rounded-full bg-brand-800 text-white"
          >
            {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
            <span className="sr-only">Menu</span>
          </button>
        </div>
        {open && (
          <nav
            id="admin-menu"
            aria-label="Navigation administration"
            className="animate-fade bg-brand-900 px-4 pb-4"
          >
            {nav}
            <div className="mt-3 border-t border-brand-800 pt-3 [&_button]:text-brand-100">
              <LogoutButton area="admin" />
            </div>
          </nav>
        )}
      </div>

      <div className="flex-1">
        <main id="contenu" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
