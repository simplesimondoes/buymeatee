import { ImageResponse } from "next/og";

import { getPublicGoalsForCreator } from "@/lib/goals/public";
import { goalProgressPercent } from "@/lib/goals/types";
import { formatMinorAmount } from "@/lib/payments/currency";
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

async function loadCardData(username: string): Promise<CardData | null> {
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

  const name = profile.display_name || profile.username;
  let goal: CardData["goal"] = null;
  try {
    const goals = await getPublicGoalsForCreator(profile.id);
    const top = goals.active[0];
    if (top) {
      const percent = goalProgressPercent(top.raised_amount, top.target_amount);
      const target = formatMinorAmount(top.target_amount, top.currency);
      const line =
        top.raised_amount > 0
          ? `${formatMinorAmount(top.raised_amount, top.currency)} of ${target} · ${percent}%`
          : `${target} goal · be the first to back it`;
      goal = { title: top.title, line, percent };
    }
  } catch {
    goal = null;
  }
  return { name, goal };
}

function Card({ data }: { data: CardData | null }) {
  const headline = data ? `Support ${data.name}` : "Support the journey.";
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
          Support the journey
        </div>
        <div
          style={{
            fontSize: 82,
            fontWeight: 700,
            color: WHITE,
            lineHeight: 1.05,
          }}
        >
          {headline}
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
            Back a real goal and follow a golfer&apos;s journey.
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
  params: Promise<{ username: string }>;
}) {
  let data: CardData | null = null;
  try {
    const { username } = await params;
    data = await loadCardData(username.toLowerCase());
  } catch {
    // Supabase unconfigured or unreachable: fall back to the generic card.
    data = null;
  }
  return new ImageResponse(<Card data={data} />, size);
}
