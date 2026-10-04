import type { Metadata } from "next";
import Form from "next/form";
import { Verweis } from "@/components/site/verweis";

import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { highlight } from "./_lib/highlight";
import { searchSite } from "@/data/queries";

// Result pages are thin and endless — keep them out of the index, but let crawlers follow links.
export const metadata: Metadata = { title: "Suche", robots: { index: false, follow: true } };

type Props = { searchParams: Promise<{ q?: string | string[] }> };

const MIN_LENGTH = 2;

function resultCount(count: number, query: string) {
  if (count === 0) return `Keine Ergebnisse für „${query}“`;
  return `${count} ${count === 1 ? "Ergebnis" : "Ergebnisse"} für „${query}“`;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 100) ?? "";
  const searched = query.length >= MIN_LENGTH;
  const results = searched ? await searchSite(query) : [];
  const suggestions: { href: string; label: string }[] = [
    { href: "/projekte", label: "Projekte" },
    { href: "/kontakt", label: "Kontakt" },
  ];

  return (
    <main>
      <PageHeader title="Suche">
        <Form action="/suche" role="search" className="mt-10 max-w-3xl">
          <Label htmlFor="suche-begriff" className="text-base">
            Suchbegriff
          </Label>
          {/* One large field with the magnifier inside it; the button beside it on wide screens. */}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 fill-none stroke-primary-soft stroke-2 [stroke-linecap:round]"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <Input
                id="suche-begriff"
                name="q"
                type="search"
                defaultValue={query}
                minLength={MIN_LENGTH}
                required
                autoComplete="off"
                className="h-14 rounded-full bg-card pr-5 pl-13 text-lg transition-[border-color,box-shadow] duration-200 focus-visible:border-primary-soft md:text-lg"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 rounded-full px-8 text-base">
              Suchen
            </Button>
          </div>
        </Form>
      </PageHeader>

      {/* Always rendered, so screen readers hear the new count after each search. */}
      <p aria-live="polite" className="sr-only">
        {searched ? resultCount(results.length, query) : ""}
      </p>

      <div className="page-container py-16 sm:py-24">
        {query && !searched ? (
          <p className="text-lg text-muted-foreground">
            Bitte geben Sie mindestens {MIN_LENGTH} Zeichen ein.
          </p>
        ) : null}

        {!searched ? (
          // Before a search: what the search covers, and where most visitors want to go.
          <section aria-labelledby="suche-vorschlaege" className="max-w-4xl">
            <h2 id="suche-vorschlaege" className="text-lg text-muted-foreground">
              Durchsucht werden alle Seiten und Projekte dieser Website. Häufig gesucht:
            </h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {suggestions.map((s) => (
                <li key={s.href}>
                  <Verweis
                    href={s.href as never}
                    className="inline-flex items-center gap-2.5 rounded-full border border-primary-soft/25 bg-card px-5 py-2.5 text-base transition-colors hover:border-primary-soft/60 hover:text-primary-soft"
                  >
                    {s.label}
                  </Verweis>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section aria-labelledby="suche-ergebnisse" className="max-w-4xl">
            <h2 id="suche-ergebnisse" className="text-lg text-muted-foreground">
              {resultCount(results.length, query)}
            </h2>
            {results.length ? (
              <ol className="mt-6 border-b">
                {results.map((result) => (
                  <li key={result.id} className="border-t">
                    {/* Only the title names the link; the whole row is its target. */}
                    <div className="group relative -mx-4 rounded-2xl px-4 py-7 transition-colors hover:bg-card">
                      <p className="text-sm font-medium text-primary-soft">
                        {result.url.startsWith("/projekte/") ? "Projekt" : "Seite"}
                        <span className="text-muted-foreground"> · {result.url}</span>
                      </p>
                      <Verweis
                        href={result.url as never}
                        className="mt-2 block text-2xl font-medium tracking-tight decoration-primary-soft decoration-2 underline-offset-8 outline-none group-hover:underline after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-ring"
                      >
                        <Marked text={result.title} query={query} />
                      </Verweis>
                      {result.summary ? (
                        <p className="mt-3 max-w-prose text-lg text-pretty text-muted-foreground">
                          <Marked text={result.summary} query={query} />
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-6 text-lg text-pretty text-muted-foreground">
                Versuchen Sie einen anderen Begriff oder sehen Sie sich unsere{" "}
                <Verweis
                  href="/projekte"
                  className="text-foreground underline decoration-primary-soft underline-offset-4 transition-colors hover:text-primary-soft"
                >
                  Projekte
                </Verweis>{" "}
                an.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

/** The result text with the searched words marked. */
function Marked({ text, query }: { text: string; query: string }) {
  return highlight(text, query).map((piece, i) =>
    piece.hit ? (
      <mark key={i} className="rounded-sm bg-primary-soft/20 px-0.5 text-foreground">
        {piece.text}
      </mark>
    ) : (
      piece.text
    ),
  );
}
