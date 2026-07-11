import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  heading: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  /** Set when rendered on a deep-green panel. */
  tone?: "light" | "dark";
  /** Heading level — sections default to h2. */
  as?: "h1" | "h2" | "h3";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  heading,
  intro,
  align = "center",
  tone = "light",
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";
  const eyebrowColour = tone === "dark" ? "text-gold" : "text-gold-deep";
  const headingColour = tone === "dark" ? "text-cream" : "text-forest";
  const introColour = tone === "dark" ? "text-cream/80" : "text-ink/70";

  return (
    <div className={`max-w-2xl ${alignment} ${className ?? ""}`}>
      {eyebrow ? (
        <p
          className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${eyebrowColour}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <Heading
        className={`font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl ${headingColour}`}
      >
        {heading}
      </Heading>
      {intro ? (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${introColour}`}>
          {intro}
        </p>
      ) : null}
    </div>
  );
}
