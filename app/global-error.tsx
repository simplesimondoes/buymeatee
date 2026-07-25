"use client";

/**
 * Last-resort error boundary rendered when something fails outside the
 * [locale] tree (it must render its own <html>). Deliberately minimal and
 * English-only: at this point no locale context is available.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1>Something went wrong</h1>
          <p>Please try again in a moment.</p>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.6rem 1.4rem",
              borderRadius: "9999px",
              border: "1px solid #073e2e",
              background: "#073e2e",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
