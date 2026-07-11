import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "BuyMeATee — Support the journey. Where golf fans help creators chase their goals.";

/** Default social-sharing image, generated from brand tokens. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #073e2e 0%, #052d23 100%)",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="56" height="56" viewBox="0 0 64 64">
            <g fill="#b69755">
              <circle cx="32" cy="17" r="8" />
              <path d="M18.5 29.5h27c1.3 0 2.1 1.45 1.4 2.55l-5.2 8.05a2.6 2.6 0 0 1-2.2 1.2H24.5a2.6 2.6 0 0 1-2.2-1.2l-5.2-8.05c-.7-1.1.1-2.55 1.4-2.55Z" />
              <path d="M28.4 45h7.2l-2.5 15.6a1.1 1.1 0 0 1-2.2 0L28.4 45Z" />
            </g>
          </svg>
          <div
            style={{
              fontSize: 44,
              fontStyle: "italic",
              fontWeight: 700,
              color: "#f6f1e7",
            }}
          >
            BuyMeATee
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#f6f1e7",
              lineHeight: 1.05,
            }}
          >
            Support the journey.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              color: "rgba(246, 241, 231, 0.75)",
              lineHeight: 1.4,
            }}
          >
            Where golf fans help creators play more, achieve more and chase
            their goals.
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#b69755",
          }}
        >
          {siteConfig.domain}
        </div>
      </div>
    ),
    size,
  );
}
