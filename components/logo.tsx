import Link from "next/link";

type LogoProps = {
  /** "dark" = ink text for light backgrounds; "light" = cream text for dark backgrounds. */
  variant?: "dark" | "light";
  className?: string;
};

/**
 * BuyMeATee brand mark: golf-tee glyph + serif wordmark.
 * Programmatic (SVG + text), so it scales, recolours and stays accessible.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {/* Golf ball */}
      <circle cx="12" cy="4.6" r="3.1" />
      {/* Tee cup */}
      <path d="M6.9 9.4h10.2c.5 0 .8.55.53.97l-2.03 3.13a1 1 0 0 1-.84.46h-5.52a1 1 0 0 1-.84-.46L6.37 10.37c-.27-.42.03-.97.53-.97Z" />
      {/* Tee stem */}
      <path d="M10.6 15.4h2.8l-.98 6.06a.43.43 0 0 1-.84 0L10.6 15.4Z" />
    </svg>
  );
}

export function Logo({ variant = "dark", className }: LogoProps) {
  const colour =
    variant === "dark" ? "text-forest" : "text-cream";
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 ${colour} ${className ?? ""}`}
      aria-label="BuyMeATee — home"
    >
      <LogoMark className="h-6 w-6 shrink-0" />
      <span className="font-serif text-2xl font-semibold italic tracking-tight leading-none">
        BuyMeATee
      </span>
    </Link>
  );
}
