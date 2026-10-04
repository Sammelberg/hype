import type { Metadata } from "next";
import Link from "next/link";

import { ClosingCta } from "@/components/site/closing-cta";
import { PageHeader } from "@/components/site/page-header";
import { getProjekte, getProjekteContent } from "@/data/queries";
import { buildMetadata } from "@/lib/seo";

// The page „projekte“ (/admin → Seiten → Projekte): its lead, SEO and the text shown while no
// project is published; the list itself is every published project (/admin → Projekte).
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getProjekteContent();
  return buildMetadata({
    meta: page?.meta,
    fallbackTitle: page?.title || "Projekte",
    fallbackDescription: page?.lead,
    path: "/projekte",
  });
}

export default async function ProjekteIndex() {
  const [projekte, { page, sections }] = await Promise.all([getProjekte(), getProjekteContent()]);

  return (
    <main>
      <PageHeader title={page?.title || "Projekte"} lead={page?.lead} />
      {projekte.length > 0 ? (
        <ul
          aria-label="Projekte"
          className="page-container grid gap-4 py-16 sm:grid-cols-2 sm:py-24 lg:grid-cols-3"
          data-cms-zone="projekte"
        >
          {projekte.map((projekt) => (
            <li
              key={projekt.id}
              className="relative flex flex-col gap-3 rounded-xl border bg-card p-6 transition-colors hover:bg-muted/50"
            >
              <p className="text-sm font-medium text-muted-foreground">{projekt.kunde}</p>
              <h2 className="text-2xl font-semibold tracking-tight text-balance">
                {/* Only the title names the link; the whole card is its target. */}
                <Link
                  href={`/projekte/${projekt.slug}` as never}
                  className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-ring"
                >
                  {projekt.title}
                </Link>
              </h2>
              <p className="text-pretty text-muted-foreground">{projekt.summary}</p>
            </li>
          ))}
        </ul>
      ) : sections.empty ? (
        <p className="page-container py-16 text-lg text-muted-foreground" data-cms-zone="projekte">
          {sections.empty}
        </p>
      ) : null}
      <ClosingCta />
    </main>
  );
}
