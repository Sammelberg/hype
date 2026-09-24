import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";

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
    <main className="page-container max-w-3xl pt-16 sm:pt-24">
      <h1 className="text-4xl font-semibold tracking-tight text-balance">Suche</h1>

      <Form action="/suche" role="search" className="mt-8">
        <Label htmlFor="suche-begriff">Suchbegriff</Label>
        <div className="mt-2 flex gap-3">
          <Input
            id="suche-begriff"
            name="q"
            type="search"
            defaultValue={query}
            minLength={MIN_LENGTH}
            required
            autoComplete="off"
          />
          <Button type="submit">Suchen</Button>
        </div>
      </Form>

      {/* Always rendered, so screen readers hear the new count after each search. */}
      <p aria-live="polite" className="sr-only">
        {searched ? resultCount(results.length, query) : ""}
      </p>

      {query && !searched ? (
        <p className="mt-8 text-muted-foreground">
          Bitte geben Sie mindestens {MIN_LENGTH} Zeichen ein.
        </p>
      ) : null}

      {searched ? (
        <section aria-labelledby="suche-ergebnisse" className="mt-12">
          <h2 id="suche-ergebnisse" className="text-sm font-medium text-muted-foreground">
            {resultCount(results.length, query)}
          </h2>
          {results.length ? (
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {results.map((result) => (
                <li key={result.id} className="py-5">
                  <p className="text-xs text-muted-foreground">Seite</p>
                  <Link
                    href={result.url as never}
                    className="mt-1 inline-block font-medium decoration-primary underline-offset-4 hover:underline"
                  >
                    {result.title}
                  </Link>
                  {result.summary ? (
                    <p className="mt-1 text-sm text-pretty text-muted-foreground">
                      {result.summary}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-pretty text-muted-foreground">
              Versuchen Sie einen anderen Begriff oder gehen Sie zur{" "}
              <Link
                href="/"
                className="underline decoration-primary underline-offset-4 transition-colors hover:text-primary"
              >
                Startseite
              </Link>
              .
            </p>
          )}
        </section>
      ) : null}
    </main>
  );
}
