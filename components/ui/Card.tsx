import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

/** White surface used across the whole app (public cards, dashboard panels). */
export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <Tag className={cn("rounded-2xl border border-ink-200/70 bg-white shadow-card", className)}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
