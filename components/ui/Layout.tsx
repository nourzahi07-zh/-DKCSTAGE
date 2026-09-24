import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

/** Page width container. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

/** Vertical rhythm for public page sections. */
export function Section({
  children,
  className,
  id,
  tone = "cream",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "cream" | "white" | "brand";
}) {
  const tones = {
    cream: "bg-cream",
    white: "bg-white",
    brand: "bg-brand-900 text-brand-50",
  };
  return (
    <section id={id} className={cn("py-16 sm:py-24", tones[tone], className)}>
      <Container>{children}</Container>
    </section>
  );
}

/** Eyebrow + title + intro, used at the top of most sections. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.14em]",
            tone === "dark" ? "text-brand-600" : "text-brand-200",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "mt-2 text-3xl font-semibold sm:text-4xl",
          tone === "dark" ? "text-ink-900" : "text-white",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("mt-4 text-lg", tone === "dark" ? "text-ink-600" : "text-brand-100")}>
          {description}
        </p>
      )}
    </div>
  );
}
