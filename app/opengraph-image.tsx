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
        <div
          style={{
            fontSize: 44,
            fontStyle: "italic",
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          BuyMeATee
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.05,
            }}
          >
            Support the journey.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              color: "rgba(255, 255, 255, 0.78)",
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
