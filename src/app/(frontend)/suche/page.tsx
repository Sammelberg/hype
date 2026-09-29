import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";

import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <main>
      <PageHeader title="Suche" horizonKey="/suche">
        <Form action="/suche" role="search" className="mt-10 max-w-3xl">
          <Label htmlFor="suche-begriff" className="text-base">
            Suchbegriff
          </Label>
          <div className="mt-3 flex gap-3">
            <Input
              id="suche-begriff"
              name="q"
              type="search"
              defaultValue={query}
              minLength={MIN_LENGTH}
              required
              autoComplete="off"
              className="h-12 text-lg md:text-lg"
            />
            <Button type="submit" size="lg" className="h-12">
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

        {!query ? (
          <p className="text-lg text-muted-foreground">
            Durchsucht werden alle Seiten und Projekte dieser Website.
          </p>
        ) : null}

        {searched ? (
          <section aria-labelledby="suche-ergebnisse" className="max-w-4xl">
            <h2 id="suche-ergebnisse" className="text-lg text-muted-foreground">
              {resultCount(results.length, query)}
            </h2>
            {results.length ? (
              <ul className="mt-6 border-b">
                {results.map((result) => (
                  <li key={result.id} className="border-t py-8">
                    <Link
                      href={result.url as never}
                      className="text-2xl font-medium tracking-tight decoration-primary-soft decoration-2 underline-offset-8 hover:underline"
                    >
                      {result.title}
                    </Link>
                    {result.summary ? (
                      <p className="mt-3 max-w-prose text-lg text-pretty text-muted-foreground">
                        {result.summary}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-lg text-pretty text-muted-foreground">
                Versuchen Sie einen anderen Begriff oder sehen Sie sich unsere{" "}
                <Link
                  href="/leistungen"
                  className="text-foreground underline decoration-primary-soft underline-offset-4 transition-colors hover:text-primary-soft"
                >
                  Leistungen
                </Link>{" "}
                an.
              </p>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
