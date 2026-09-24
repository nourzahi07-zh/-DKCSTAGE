import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

/**
 * Entrance animation for content that is already on screen (the hero).
 * Pure CSS, so it needs no JavaScript and cannot leave content hidden;
 * the reduced-motion rule in globals.css disables it.
 */
export function Rise({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={cn("animate-rise", className)} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
