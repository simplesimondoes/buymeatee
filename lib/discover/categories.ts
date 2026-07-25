import {
  Building2,
  Camera,
  FlaskConical,
  Flag,
  GraduationCap,
  Heart,
  Mic,
  Plane,
  Smartphone,
  Sprout,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

/**
 * Discover browse categories. These are structural browse facets, not a field
 * stored on creator profiles yet — so today they organise Preview content and
 * filter what a supporter is looking for. When creators can self-categorise,
 * the same slugs drive real filtering.
 *
 * Slugs are stable, language-neutral identifiers. The human-readable labels
 * live in the `discover` message namespace (`categories.<slug>` in
 * `messages/<locale>/discover.json`); render them with
 * `t(categoryLabelKey(slug))`.
 */

export type DiscoverCategory = {
  slug: string;
  icon: LucideIcon;
};

export const discoverCategories: DiscoverCategory[] = [
  { slug: "golf-apps", icon: Smartphone },
  { slug: "content-creators", icon: Video },
  { slug: "professional-golfers", icon: Trophy },
  { slug: "amateurs", icon: Flag },
  { slug: "junior-golf", icon: Sprout },
  { slug: "charities", icon: Heart },
  { slug: "golf-trips", icon: Plane },
  { slug: "golf-societies", icon: Users },
  { slug: "golf-coaches", icon: GraduationCap },
  { slug: "club-projects", icon: Building2 },
  { slug: "equipment-testing", icon: FlaskConical },
  { slug: "golf-photography", icon: Camera },
  { slug: "golf-podcasts", icon: Mic },
];

/** Message key for a category label, relative to the `discover` namespace. */
export function categoryLabelKey(slug: string): string {
  return `categories.${slug}`;
}
