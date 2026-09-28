import type { Metadata } from "next";
import Link from "next/link";

import { getProjekte } from "@/data/queries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    fallbackTitle: "Projekte",
    fallbackDescription: "Ausgewählte Projekte von Schwarzwald Systems.",
    path: "/projekte",
  });
}

export default async function ProjekteIndex() {
  const projekte = await getProjekte();

  return (
    <main className="page-container max-w-3xl pt-16 sm:pt-24">
      <h1 className="text-4xl font-semibold tracking-tight text-balance">Projekte</h1>
      <p className="mt-4 max-w-prose text-lg text-pretty text-muted-foreground">
        Ausgewählte Projekte, die wir für unsere Kundinnen und Kunden gebaut haben.
      </p>
      {projekte.length > 0 ? (
        <ul className="mt-12 space-y-10">
          {projekte.map((projekt) => (
            <li key={projekt.id} className="border-t pt-8">
              <Link
                href={`/projekte/${projekt.slug}` as never}
                className="group block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <p className="text-sm font-medium text-primary-soft">{projekt.kunde}</p>
                <h2 className="mt-1 text-2xl font-medium tracking-tight group-hover:text-primary-soft">
                  {projekt.title}
                </h2>
                <p className="mt-2 text-pretty text-muted-foreground">{projekt.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-muted-foreground">Bald an dieser Stelle.</p>
      )}
    </main>
  );
}
