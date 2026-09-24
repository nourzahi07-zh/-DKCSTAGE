"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";

/** Submit button that disables itself and shows progress while the form posts. */
export function SubmitButton({
  children,
  pendingLabel = "Veuillez patienter…",
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={buttonClasses(variant, size, className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
