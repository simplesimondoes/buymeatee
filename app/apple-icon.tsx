import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** PNG app icon generated from the brand mark (SVG favicon lives at app/icon.svg). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#073e2e",
          borderRadius: 36,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <g fill="#f6f1e7">
            <circle cx="32" cy="17" r="8" />
            <path d="M18.5 29.5h27c1.3 0 2.1 1.45 1.4 2.55l-5.2 8.05a2.6 2.6 0 0 1-2.2 1.2H24.5a2.6 2.6 0 0 1-2.2-1.2l-5.2-8.05c-.7-1.1.1-2.55 1.4-2.55Z" />
            <path d="M28.4 45h7.2l-2.5 15.6a1.1 1.1 0 0 1-2.2 0L28.4 45Z" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
