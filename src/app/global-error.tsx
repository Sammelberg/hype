"use client";

import { useEffect } from "react";

// Replaces the root layout when it fails, so globals.css and fonts are not available:
// styles are inline and follow the OS colour scheme.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "1.3125rem",
          fontFamily: "system-ui, sans-serif",
          colorScheme: "light dark",
          background: "Canvas",
          color: "CanvasText",
        }}
      >
        <title>Fehler</title>
        <main style={{ maxWidth: "36rem" }}>
          <h1 style={{ fontSize: "1.875rem", margin: 0 }}>Etwas ist schiefgelaufen</h1>
          <p style={{ lineHeight: 1.6 }}>
            Die Website konnte nicht geladen werden. Bitte versuchen Sie es in einem Moment erneut.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem", opacity: 0.7 }}>
              Fehler-ID: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1.3125rem",
              padding: "0.5rem 1rem",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Erneut versuchen
          </button>
        </main>
      </body>
    </html>
  );
}
