import type { Metadata } from "next";
import { connection } from "next/server";

import { buchungsDaten } from "@/buchung/daten/buchen";
import { vorauswahl } from "@/buchung/logik/buchen";
import { berlinTag } from "@/buero/logik/kalender";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { Verweis } from "@/components/site/verweis";
import { env } from "@/env";

import { BuchenAssistent } from "./_components/assistent";
import { signiereStart } from "./_lib/start-token";
import { onlineZahlung } from "@/lib/zahlung";

// The booking form. Per request: the start time is signed for this visit (anti-spam, as on
// /kontakt), and the calendar starts today. ?figur=, ?paket= and ?ort= (slugs) preselect what the
// link came from — a Figur's page, the price list, a town's page, the home page's card.

export const metadata: Metadata = {
  title: "Feier buchen",
  description:
    "Figur, Paket, Ort und Termin wählen, den Endpreis sehen und den Termin gleich festhalten.",
  alternates: { canonical: "/buchen" },
  // A form with a different state per visit has nothing for search engines.
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function besuch() {
  await connection();
  const jetzt = new Date();
  return { heute: berlinTag(jetzt), startToken: signiereStart(jetzt.getTime(), env.FORM_SECRET) };
}

export default async function BuchenSeite({ searchParams }: Props) {
  const [params, { heute, startToken }, daten] = await Promise.all([
    searchParams,
    besuch(),
    buchungsDaten(onlineZahlung() !== null),
  ]);

  return (
    <main className="page-container pt-8 pb-16 sm:pt-12 lg:pb-24">
      <PageBreadcrumbs
        trail={[
          { name: "Startseite", path: "/" },
          { name: "Feier buchen", path: "/buchen" },
        ]}
      />
      <h1 className="mt-6 font-hand text-4xl leading-tight font-semibold text-balance sm:text-5xl">
        Feier buchen
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-pretty text-muted-foreground">
        In fünf kurzen Schritten. Den Endpreis sehen Sie die ganze Zeit; bezahlt wird erst am Ende.
      </p>
      <noscript>
        <p className="mt-6 rounded-2xl bg-secondary p-5 text-base">
          Der Buchungskalender braucht JavaScript. Ohne schreiben Sie uns einfach über das{" "}
          <Verweis href="/kontakt" className="underline underline-offset-4">
            Kontaktformular
          </Verweis>
          .
        </p>
      </noscript>
      <div className="mt-8">
        <BuchenAssistent
          daten={daten}
          start={vorauswahl(params, daten)}
          heute={heute}
          startToken={startToken}
        />
      </div>
    </main>
  );
}
