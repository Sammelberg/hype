import type { Metadata } from "next";

import {
  ALTERSGRUPPEN,
  filterAusParams,
  filtereFiguren,
  filterLink,
  type KatalogFilter,
} from "@/buchung/logik/katalog";
import { KATEGORIE_NAMEN, SPRACH_NAMEN, SPRACHEN } from "@/buchung/logik/typen";
import { Reveal } from "@/components/motion/reveal";
import { FigurKarte } from "@/components/site/figur-karte";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { PageHeader } from "@/components/site/page-header";
import { Verweis } from "@/components/site/verweis";
import { getKatalog } from "@/data/katalog";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

// The catalogue of Figuren (/admin → Buchung → Figuren), filtered by age, language and theme from
// the address, so a filtered list is a link and works without scripts. Every filtered view points
// its canonical at /figuren.

export const metadata: Metadata = buildMetadata({
  fallbackTitle: "Figuren für den Kindergeburtstag",
  fallbackDescription:
    "Eisprinzessin, Superheld, Pirat oder Dino-Forscherin: alle Figuren mit Alter, Sprache und Preis. Online buchen in Aschaffenburg, Frankfurt und Umgebung.",
  path: "/figuren",
});

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function FilterZeile({
  titel,
  filter,
  schluessel,
  werte,
}: {
  titel: string;
  filter: KatalogFilter;
  schluessel: keyof KatalogFilter;
  werte: { wert: string; name: string }[];
}) {
  const aktiv = filter[schluessel];
  const chips = [{ wert: undefined, name: "Alle" }, ...werte];
  return (
    // min-w-0: a grid cell would otherwise grow to the row's full width instead of scrolling it.
    <div className="min-w-0">
      <p id={`filter-${schluessel}`} className="text-sm font-medium">
        {titel}
      </p>
      {/* One row that scrolls sideways on a phone instead of wrapping into a wall of chips. */}
      <ul
        aria-labelledby={`filter-${schluessel}`}
        className="-mx-gutter mt-2 flex gap-2 overflow-x-auto px-gutter pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {chips.map((chip) => {
          const gewaehlt = aktiv === chip.wert;
          return (
            <li key={chip.name} className="shrink-0">
              <Verweis
                href={filterLink(filter, { [schluessel]: chip.wert }) as never}
                aria-current={gewaehlt ? "true" : undefined}
                scroll={false}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-base whitespace-nowrap",
                  gewaehlt
                    ? "border-foreground bg-foreground text-background"
                    : "bg-card hover:border-foreground/40",
                )}
              >
                {chip.name}
              </Verweis>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function FigurenSeite({ searchParams }: Props) {
  const [alle, params] = await Promise.all([getKatalog(), searchParams]);
  const filter = filterAusParams(params);
  const figuren = filtereFiguren(alle, filter);
  const kategorien = [...new Set(alle.map((f) => f.kategorie))];

  return (
    <main>
      <PageHeader
        title="Wer kommt zur Feier?"
        lead="Jede Figur kommt im Kostüm, spielt, singt und tanzt mit den Kindern. Wählen Sie nach Alter, Sprache oder Thema."
        breadcrumbs={
          <PageBreadcrumbs
            trail={[
              { name: "Startseite", path: "/" },
              { name: "Figuren", path: "/figuren" },
            ]}
          />
        }
      />

      <div className="page-container py-10 sm:py-16">
        <nav aria-label="Figuren filtern" className="grid gap-5 lg:grid-cols-3 lg:gap-8">
          <FilterZeile
            titel="Alter der Kinder"
            filter={filter}
            schluessel="alter"
            werte={Object.entries(ALTERSGRUPPEN).map(([wert, g]) => ({ wert, name: g.name }))}
          />
          <FilterZeile
            titel="Sprache"
            filter={filter}
            schluessel="sprache"
            werte={SPRACHEN.map((s) => ({ wert: s, name: SPRACH_NAMEN[s] }))}
          />
          <FilterZeile
            titel="Thema"
            filter={filter}
            schluessel="kategorie"
            werte={kategorien.map((k) => ({ wert: k, name: KATEGORIE_NAMEN[k] }))}
          />
        </nav>

        <p className="mt-10 text-base text-muted-foreground tabular-nums">
          {figuren.length === 1 ? "1 Figur" : `${figuren.length} Figuren`}
        </p>

        <h2 className="sr-only">Figuren</h2>
        {figuren.length > 0 ? (
          <ul
            aria-label="Figuren"
            className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4"
          >
            {figuren.map((figur, i) => (
              <Reveal as="li" key={figur.id} order={i % 4}>
                <FigurKarte
                  figur={figur}
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                />
              </Reveal>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-3xl bg-secondary p-8">
            <p className="text-lg">Zu dieser Auswahl passt gerade keine Figur.</p>
            <Verweis
              href="/figuren"
              className="mt-4 inline-flex min-h-11 items-center font-medium underline underline-offset-4"
            >
              Alle Figuren zeigen
            </Verweis>
          </div>
        )}
      </div>
    </main>
  );
}
