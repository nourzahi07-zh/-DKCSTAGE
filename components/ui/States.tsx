import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

/** Grey placeholder shown while server data is loading (see loading.tsx files). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-ink-100", className)} aria-hidden="true" />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
      <Skeleton className="h-5 w-1/3" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

/** Friendly "nothing here yet" block. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {icon}
        </div>
      )}
      <p className="font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
