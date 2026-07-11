import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  /**
   * primary: solid forest on light backgrounds.
   * secondary: outlined forest on light backgrounds.
   * onDark: solid cream — for deep-green panels.
   * onDarkOutline: outlined cream — for deep-green panels.
   */
  variant?: "primary" | "secondary" | "onDark" | "onDarkOutline";
  size?: "md" | "lg";
  className?: string;
};

const variantClasses: Record<NonNullable<ButtonLinkProps["variant"]>, string> =
  {
    primary:
      "bg-forest text-cream hover:bg-forest-dark",
    secondary:
      "border border-forest/30 text-forest hover:border-forest hover:bg-forest/5",
    onDark: "bg-cream text-forest hover:bg-white",
    onDarkOutline:
      "border border-cream/40 text-cream hover:border-cream hover:bg-cream/10",
  };

const sizeClasses: Record<NonNullable<ButtonLinkProps["size"]>, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-medium transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}
