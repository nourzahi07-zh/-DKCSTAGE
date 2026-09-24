import Link from "next/link";
import { cn } from "@/lib/ui";

/** DKC mark: a simple "care" curve, drawn inline so it scales and themes cleanly. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-9", className)}>
      <rect width="40" height="40" rx="12" className="fill-brand-700" />
      <path
        d="M12 26c0-6 4-11 9-11 3.2 0 5.4 2 5.4 4.8 0 4.4-5.2 6.4-11.2 6.4"
        className="stroke-brand-100"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="27" cy="14" r="2.6" className="fill-sand-300" />
    </svg>
  );
}

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-lg font-semibold",
            tone === "dark" ? "text-ink-900" : "text-white",
          )}
        >
          DKC
        </span>
        <span
          className={cn(
            "block text-[11px] font-medium uppercase tracking-[0.12em]",
            tone === "dark" ? "text-ink-500" : "text-brand-200",
          )}
        >
          Diabète Kiné Care
        </span>
      </span>
    </Link>
  );
}
