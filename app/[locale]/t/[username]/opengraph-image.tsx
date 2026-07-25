import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { defaultLocale, isAppLocale, type AppLocale } from "@/i18n/locales";
import { getPublicGoalsForCreator } from "@/lib/goals/public";
import { goalProgressPercent } from "@/lib/goals/types";
import { formatMinorAmount, formatPercent } from "@/lib/i18n/format";
import { siteConfig } from "@/lib/site";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Shareable card for a creator's page. Brand-styled, generated from the same
 * verified data the public page shows — a real goal's honest progress when
 * there is one, and a clean "Support the journey" card otherwise. Always
 * degrades to the generic card rather than failing, so a shared link never
 * unfurls broken.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Support the journey on BuyMeATee.";

// Brand hex — ImageResponse can't read the CSS-variable tokens (globals.css).
const FOREST = "#073e2e";
const FOREST_DARK = "#052d23";
const GOLD = "#bd9c5d";
const WHITE = "#ffffff";

const USERNAME_PATTERN = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/;

type CardData = {
  name: string;
  goal: { title: string; line: string; percent: number } | null;
};

type CardText = {
  kicker: string;
  headline: string;
  tagline: string;
};

async function loadCardData(
  username: string,
  locale: AppLocale,
): Promise<CardData | null> {
  if (!USERNAME_PATTERN.test(username)) {
    return null;
  }
  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, deactivated_at")
    .eq("username", username)
    .maybeSingle();
  if (!profile || profile.deactivated_at) {
    return null;
  }

  const t = await getTranslations({ locale, namespace: "profilePage" });
  const name = profile.display_name || profile.username;
  let goal: CardData["goal"] = null;
  try {
    const goals = await getPublicGoalsForCreator(profile.id);
    const top = goals.active[0];
    if (top) {
      const percent = goalProgressPercent(top.raised_amount, top.target_amount);
      const target = formatMinorAmount(top.target_amount, top.currency, locale);
      const line =
        top.raised_amount > 0
          ? t("ogCard.goalLine", {
              raised: formatMinorAmount(top.raised_amount, top.currency, locale),
              target,
              percent: formatPercent(percent, locale),
            })
          : t("ogCard.goalLineFresh", { target });
      goal = { title: top.title, line, percent };
    }
  } catch {
    goal = null;
  }
  return { name, goal };
}

function Card({ data, text }: { data: CardData | null; text: CardText }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `linear-gradient(135deg, ${FOREST} 0%, ${FOREST_DARK} 100%)`,
        padding: 80,
      }}
    >
      <div
        style={{
          fontSize: 44,
          fontStyle: "italic",
          fontWeight: 700,
          color: WHITE,
        }}
      >
        BuyMeATee
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 30, color: GOLD, marginBottom: 16 }}>
          {text.kicker}
        </div>
        <div
          style={{
            fontSize: 82,
            fontWeight: 700,
            color: WHITE,
            lineHeight: 1.05,
          }}
        >
          {text.headline}
        </div>

        {data?.goal ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 36 }}>
            <div style={{ fontSize: 36, color: "rgba(255,255,255,0.9)" }}>
              {data.goal.title}
            </div>
            <div
              style={{
                display: "flex",
                width: "100%",
                height: 18,
                marginTop: 20,
                borderRadius: 999,
                background: "rgba(255,255,255,0.2)",
              }}
            >
              <div
                style={{
                  width: `${Math.max(data.goal.percent, 2)}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: GOLD,
                }}
              />
            </div>
            <div style={{ fontSize: 28, color: "rgba(255,255,255,0.78)", marginTop: 16 }}>
              {data.goal.line}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 32,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.4,
              marginTop: 28,
            }}
          >
            {text.tagline}
          </div>
        )}
      </div>

      <div style={{ fontSize: 28, color: GOLD }}>{siteConfig.domain}</div>
    </div>
  );
}

export default async function ProfileOpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale: rawLocale, username } = await params;
  const requestedLocale = isAppLocale(rawLocale) ? rawLocale : defaultLocale;
  // ImageResponse's bundled font has no CJK glyphs, so localized Japanese/
  // Korean card text would render as tofu boxes. Until a CJK-capable font is
  // embedded, the card's short labels stay English for ja/ko (creator names
  // are user content and unaffected by this choice — see the i18n report).
  const locale: AppLocale =
    requestedLocale === "ja" || requestedLocale === "ko"
      ? defaultLocale
      : requestedLocale;

  let data: CardData | null = null;
  try {
    data = await loadCardData(username.toLowerCase(), locale);
  } catch {
    // Supabase unconfigured or unreachable: fall back to the generic card.
    data = null;
  }

  let text: CardText;
  try {
    const t = await getTranslations({ locale, namespace: "profilePage" });
    text = {
      kicker: t("ogCard.kicker"),
      headline: data
        ? t("ogCard.headline", { name: data.name })
        : t("ogCard.headlineFallback"),
      tagline: t("ogCard.tagline"),
    };
  } catch {
    // Never let a translation problem break the unfurl.
    text = {
      kicker: "Support the journey",
      headline: data ? `Support ${data.name}` : "Support the journey.",
      tagline: "Back a real goal and follow a golfer's journey.",
    };
  }

  return new ImageResponse(<Card data={data} text={text} />, size);
}
