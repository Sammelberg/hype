import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { kundenSicht } from "@/buchung/daten/buchen";
import { preisText } from "@/buchung/logik/preis";
import { EinladungsKarte } from "@/components/site/einladungs-karte";
import { buttonVariants } from "@/components/ui/button";
import { env } from "@/env";

import { antworteTestzahlung } from "../actions";

// The test adapter's pretend checkout: what Mollie's page will be in phase 9, on our own site.
// Exists only while ZAHLUNG_TEST=1 (development, CI).

export const metadata: Metadata = {
  title: "Testzahlung",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Testzahlung({ params, searchParams }: Props) {
  await connection();
  if (env.ZAHLUNG_TEST !== "1") notFound();
  const [{ token }, such] = await Promise.all([params, searchParams]);
  const externId = typeof such.zahlung === "string" ? such.zahlung : "";
  const b = await kundenSicht(token, new Date());
  if (!b || !externId) notFound();

  return (
    <main className="page-container py-12 sm:py-20">
      <EinladungsKarte className="mx-auto max-w-lg">
        <p className="text-sm font-medium text-muted-foreground">Testmodus, es fließt kein Geld</p>
        <h1 className="mt-2 font-hand text-3xl font-semibold">Anzahlung für {b.nummer}</h1>
        <p className="mt-4 text-4xl font-semibold tabular-nums">
          {preisText(b.anzahlungCent ?? 0)}
        </p>
        <div className="mt-8 grid gap-3">
          <form action={antworteTestzahlung.bind(null, token, externId, "bezahlt")}>
            <button
              type="submit"
              className={buttonVariants({
                size: "lg",
                className: "h-auto w-full rounded-full py-3.5 text-base font-semibold",
              })}
            >
              Bezahlen
            </button>
          </form>
          <form action={antworteTestzahlung.bind(null, token, externId, "abgebrochen")}>
            <button
              type="submit"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "h-auto w-full rounded-full py-3 text-base",
              })}
            >
              Abbrechen
            </button>
          </form>
        </div>
      </EinladungsKarte>
    </main>
  );
}
