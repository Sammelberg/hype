"use client";

import Link from "next/link";
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
    <main className="page-container max-w-3xl py-16 sm:py-24">
      <p className="text-sm text-muted-foreground tabular-nums">Fehler</p>
      <h1
        ref={heading}
        tabIndex={-1}
        className="mt-2 text-3xl font-semibold tracking-tight outline-none"
      >
        Etwas ist schiefgelaufen
      </h1>
      <p className="mt-4 text-pretty text-muted-foreground">
        Die Seite konnte nicht geladen werden. Versuchen Sie es erneut oder kehren Sie zur
        Startseite zurück.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground">Fehler-ID: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center gap-6">
        <Button onClick={() => retry()}>Erneut versuchen</Button>
        <Link
          href="/"
          className="underline decoration-primary-soft underline-offset-4 transition-colors hover:text-primary-soft"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}
