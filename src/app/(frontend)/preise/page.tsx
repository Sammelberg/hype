import { Check } from "lucide-react";
import type { Metadata } from "next";

import { preisText } from "@/buchung/logik/preis";
import { Reveal } from "@/components/motion/reveal";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { PageHeader } from "@/components/site/page-header";
import { Verweis } from "@/components/site/verweis";
import { buttonVariants } from "@/components/ui/button";
import { getPreise, getStaedte } from "@/data/katalog";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

// The price list (/admin → Buchung → Pakete, Extras, Zonen): every package, every extra and the
// travel surcharge per zone, as end prices (PAngV). Static, refreshed every five minutes.

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  fallbackTitle: "Preise für den Kindergeburtstag mit Figur",
  fallbackDescription:
    "Pakete ab 45 Minuten, Extras und Anfahrt nach Ort: alle Preise als Endpreise, bevor Sie Ihre Daten eingeben.",
  path: "/preise",
});

const H2 = "font-hand text-3xl font-semibold text-balance sm:text-4xl";

const figurenText = (n: number) => (n === 1 ? "1 Figur" : `${n} Figuren`);

export default async function PreiseSeite() {
  const [preise, staedte] = await Promise.all([getPreise(), getStaedte()]);
  const orteJeZone = (code: string) =>
    staedte
      .filter((s) => s.zone.code === code)
      .map((s) => s.name)
      .join(", ");

  return (
    <main>
      <PageHeader
        title="Preise"
        lead="Paket plus Anfahrt nach Ort. Den Endpreis sehen Sie, bevor Sie Ihre Daten eingeben; später kommt nichts dazu."
        breadcrumbs={
          <PageBreadcrumbs
            trail={[
              { name: "Startseite", path: "/" },
              { name: "Preise", path: "/preise" },
            ]}
          />
        }
      />

      <section aria-labelledby="pakete-titel" className="page-container py-12 sm:py-20">
        <h2 id="pakete-titel" className={H2}>
          Pakete
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {preise.pakete.map((paket, i) => (
            <Reveal
              as="li"
              key={paket.id}
              order={i}
              className="flex flex-col rounded-3xl border bg-card p-6"
            >
              <h3 className="font-hand text-2xl font-semibold">{paket.name}</h3>
              <p className="mt-3 text-4xl font-semibold tabular-nums">
                {paket.preisCent !== null && !paket.nurAnfrage
                  ? preisText(paket.preisCent)
                  : "Auf Anfrage"}
              </p>
              <p className="mt-1 text-base text-muted-foreground">
                {paket.dauerMin ? `${paket.dauerMin} Minuten, ` : ""}
                {figurenText(paket.figurenAnzahl)}
              </p>
              {paket.beschreibung ? (
                <p className="mt-4 text-base text-pretty">{paket.beschreibung}</p>
              ) : null}
              {paket.leistungen.length > 0 ? (
                <ul className="mt-4 grid gap-2 text-base">
                  {paket.leistungen.map((l) => (
                    <li key={l} className="flex gap-2">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-frei" />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {/* Pushes the button to the card's foot, at least a line below the list. */}
              <div aria-hidden className="min-h-6 grow" />
              <Verweis
                href={(paket.nurAnfrage ? "/kontakt" : `/buchen?paket=${paket.slug}`) as never}
                className={buttonVariants({
                  variant: paket.nurAnfrage ? "outline" : "default",
                  size: "lg",
                  className: "h-auto w-full rounded-full py-3 text-base font-semibold",
                })}
              >
                {paket.nurAnfrage ? "Anfrage senden" : `${paket.name} buchen`}
              </Verweis>
            </Reveal>
          ))}
        </ul>
      </section>

      {preise.extras.length > 0 ? (
        <section aria-labelledby="extras-titel" className="border-t">
          <div className="page-container py-12 sm:py-20">
            <h2 id="extras-titel" className={H2}>
              Extras
            </h2>
            <p className="mt-3 max-w-2xl text-base text-pretty text-muted-foreground">
              Wählen Sie bei der Buchung dazu. Was gefertigt werden muss, zeigen wir nur, solange
              die Zeit bis zur Feier reicht.
            </p>
            <ul className="mt-8 grid max-w-3xl divide-y border-y">
              {preise.extras.map((extra) => (
                <li key={extra.id} className="flex items-start justify-between gap-6 py-5">
                  <div>
                    <h3 className="text-lg font-semibold">{extra.name}</h3>
                    {extra.beschreibung ? (
                      <p className="mt-1 text-base text-pretty text-muted-foreground">
                        {extra.beschreibung}
                      </p>
                    ) : null}
                    {extra.vorlaufTage > 0 || extra.dauerDeltaMin > 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[
                          extra.vorlaufTage > 0
                            ? `Mindestens ${extra.vorlaufTage} Tage vor der Feier`
                            : null,
                          extra.dauerDeltaMin > 0 ? `${extra.dauerDeltaMin} Minuten länger` : null,
                        ]
                          .filter(Boolean)
                          .join(". ")}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-lg font-semibold whitespace-nowrap tabular-nums">
                    {extra.preisCent !== null && !extra.nurAnfrage
                      ? preisText(extra.preisCent)
                      : "Auf Anfrage"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="anfahrt-titel" className="border-t">
        <div className="page-container py-12 sm:py-20">
          <h2 id="anfahrt-titel" className={H2}>
            Anfahrt
          </h2>
          <p className="mt-3 max-w-2xl text-base text-pretty text-muted-foreground">
            Der Aufschlag hängt von der Zone Ihres Ortes ab und steht im Endpreis.
          </p>
          <ul className="mt-8 grid max-w-3xl gap-3">
            {preise.zonen.map((zone) => (
              <li
                key={zone.code}
                className={cn(
                  "flex items-start justify-between gap-6 rounded-2xl p-5",
                  zone.aufschlagCent === 0 && !zone.nurAnfrage ? "bg-secondary" : "border",
                )}
              >
                <div>
                  <h3 className="text-lg font-semibold">{zone.name}</h3>
                  {orteJeZone(zone.code) ? (
                    <p className="mt-1 text-base text-pretty text-muted-foreground">
                      {orteJeZone(zone.code)}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 text-lg font-semibold whitespace-nowrap tabular-nums">
                  {zone.nurAnfrage
                    ? "Auf Anfrage"
                    : zone.aufschlagCent === 0
                      ? "inklusive"
                      : `+ ${preisText(zone.aufschlagCent)}`}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-3xl text-sm text-pretty text-muted-foreground">
            {preise.hinweis}
          </p>
        </div>
      </section>
    </main>
  );
}
