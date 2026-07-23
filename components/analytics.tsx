import Script from "next/script";

/**
 * Google Analytics (GA4) via gtag.js.
 *
 * The measurement ID is public (it ships in browser code by design), so it can
 * live in `NEXT_PUBLIC_GA_MEASUREMENT_ID`. It defaults to the production
 * property so analytics work out of the box; set the env var to a different ID
 * (or an empty string) to override or disable per environment.
 */
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-9CMNRQ8W52";

export function Analytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
