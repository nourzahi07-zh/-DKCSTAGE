import type { ReactNode } from "react";
import { cn } from "@/lib/ui";
import { STATUS_STYLES, type AppointmentStatus, STATUS_LABELS } from "@/lib/constants";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "sand";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700",
    brand: "bg-brand-50 text-brand-700",
    sand: "bg-sand-100 text-sand-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Appointment status, always with the same colour and French label. */
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        style.badge,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
