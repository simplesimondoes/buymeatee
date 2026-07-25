import { notFound } from "next/navigation";

/**
 * Catch-all inside the locale segment: any unknown path renders the
 * localized not-found page instead of an unstyled default.
 */
export default function CatchAllNotFound() {
  notFound();
}
