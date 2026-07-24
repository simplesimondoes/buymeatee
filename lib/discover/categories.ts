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
 */

export type DiscoverCategory = {
  slug: string;
  label: string;
  icon: LucideIcon;
};

export const discoverCategories: DiscoverCategory[] = [
  { slug: "golf-apps", label: "Golf Apps", icon: Smartphone },
  { slug: "content-creators", label: "Content Creators", icon: Video },
  { slug: "professional-golfers", label: "Professional Golfers", icon: Trophy },
  { slug: "amateurs", label: "Amateurs", icon: Flag },
  { slug: "junior-golf", label: "Junior Golf", icon: Sprout },
  { slug: "charities", label: "Charities", icon: Heart },
  { slug: "golf-trips", label: "Golf Trips", icon: Plane },
  { slug: "golf-societies", label: "Golf Societies", icon: Users },
  { slug: "golf-coaches", label: "Golf Coaches", icon: GraduationCap },
  { slug: "club-projects", label: "Club Projects", icon: Building2 },
  { slug: "equipment-testing", label: "Equipment Testing", icon: FlaskConical },
  { slug: "golf-photography", label: "Golf Photography", icon: Camera },
  { slug: "golf-podcasts", label: "Golf Podcasts", icon: Mic },
];

const CATEGORY_LABELS = new Map(
  discoverCategories.map((category) => [category.slug, category.label]),
);

export function categoryLabel(slug: string | null): string | null {
  return slug ? CATEGORY_LABELS.get(slug) ?? null : null;
}
