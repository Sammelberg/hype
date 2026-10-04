"use client";

import { Verweis } from "@/components/site/verweis";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // No external error service (data sovereignty): the digest ties this to the server log.
    console.error(error);
    heading.current?.focus();
  }, [error]);

  return (
    <main>
      <div className="border-b">
        <div className="page-container py-16 sm:py-24">
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-[clamp(2.5rem,1.4rem+4vw,5rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance outline-none"
          >
            Etwas ist schiefgelaufen
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
            Die Seite konnte nicht geladen werden. Versuchen Sie es erneut oder kehren Sie zur
            Startseite zurück.
          </p>
          {error.digest ? (
            <p className="mt-4 text-sm text-muted-foreground">Fehler-ID: {error.digest}</p>
          ) : null}
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Button size="lg" onClick={() => retry()}>
              Erneut versuchen
            </Button>
            <Verweis
              href="/"
              className="text-lg underline decoration-primary-soft underline-offset-4 transition-colors hover:text-primary-soft"
            >
              Zur Startseite
            </Verweis>
          </div>
        </div>
      </div>
    </main>
  );
}
