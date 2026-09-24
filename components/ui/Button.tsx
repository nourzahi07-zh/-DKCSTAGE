import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/ui";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "destructive";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-700 text-white shadow-card hover:bg-brand-800 active:bg-brand-900",
  secondary: "border border-brand-200 bg-white text-brand-800 hover:border-brand-300 hover:bg-brand-50",
  ghost: "text-ink-700 hover:bg-ink-100",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className = "") {
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200",
    "hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({ variant, size, className, children, ...props }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
