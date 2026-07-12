import Link from "next/link";

type LogoProps = {
  /** "dark" = ink text for light backgrounds; "light" = white text for dark backgrounds. */
  variant?: "dark" | "light";
  className?: string;
};

/**
 * BuyMeATee wordmark: text-only serif italic, matching the approved concept.
 * Programmatic (styled text), so it scales, recolours and stays accessible.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`font-serif text-2xl font-bold italic tracking-tight leading-none ${className ?? ""}`}
    >
      BuyMeATee
    </span>
  );
}

export function Logo({ variant = "dark", className }: LogoProps) {
  const colour = variant === "dark" ? "text-forest" : "text-white";
  return (
    <Link
      href="/"
      className={`inline-flex items-center ${colour} ${className ?? ""}`}
      aria-label="BuyMeATee — home"
    >
      <Wordmark />
    </Link>
  );
}
