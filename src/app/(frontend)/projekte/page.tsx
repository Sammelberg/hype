import type { Metadata } from "next";
import Link from "next/link";

import { ClosingCta } from "@/components/site/closing-cta";
import { PageHeader } from "@/components/site/page-header";
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
    <main>
      <PageHeader
        title="Projekte"
        lead="Ausgewählte Projekte, die wir für unsere Kundinnen und Kunden gebaut haben."
        horizonKey="/projekte"
      />
      {projekte.length > 0 ? (
        <ul aria-label="Projekte" className="page-container">
          {projekte.map((projekt) => (
            <li
              key={projekt.id}
              className="grid gap-x-16 gap-y-3 border-b py-12 sm:py-16 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] 3xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]"
            >
              <p className="text-base font-medium text-primary-soft lg:pt-2 3xl:text-lg">
                {projekt.kunde}
              </p>
              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl">
                  <Link
                    href={`/projekte/${projekt.slug}` as never}
                    className="decoration-primary-soft decoration-2 underline-offset-8 hover:underline"
                  >
                    {projekt.title}
                  </Link>
                </h2>
                <p className="mt-4 text-lg text-pretty text-muted-foreground 3xl:text-xl">
                  {projekt.summary}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="page-container py-16 text-lg text-muted-foreground">
          Hier stellen wir bald unsere ersten Projekte vor.
        </p>
      )}
      <ClosingCta />
    </main>
  );
}
