/**
 * A creator's avatar with an accessible initials fallback — never a broken
 * image. Server-renderable; plain <img> because avatar URLs come from
 * Supabase Storage at unknown dimensions and next/image adds nothing here.
 */

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-24 w-24 text-3xl",
} as const;

export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function Avatar({
  src,
  name,
  size = "md",
}: {
  src: string | null;
  name: string;
  size?: keyof typeof sizeClasses;
}) {
  // The accessible name is the person's name alone (no possessive suffix):
  // this component renders in every locale's chrome, so it must not carry
  // English grammar. User names themselves are never translated.
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full border border-stone object-cover`}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-full border border-stone bg-mist font-serif font-semibold text-forest`}
    >
      {initialsFor(name)}
    </span>
  );
}
