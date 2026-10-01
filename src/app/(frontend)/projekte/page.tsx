import type { Metadata } from "next";
import Link from "next/link";

import { ClosingCta } from "@/components/site/closing-cta";
import { PageHeader } from "@/components/site/page-header";
import { Spotlight } from "@/components/site/spotlight";
import { StarChart } from "@/components/site/star-chart";
import { getProjekte, getProjekteContent } from "@/data/queries";
import { buildMetadata } from "@/lib/seo";

// The page „projekte“ (/admin → Seiten → Projekte): its lead, SEO and the text shown while no
// project is published; the list itself is every published project (/admin → Projekte), each
// with the constellation its own page opens with.
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
      <PageHeader title={page?.title || "Projekte"} lead={page?.lead} horizonKey="/projekte" />
      {projekte.length > 0 ? (
        // Each project a large tile beside its own constellation, alternating sides.
        <ul
          aria-label="Projekte"
          className="page-container grid gap-6 py-16 sm:py-24"
          data-cms-zone="projekte"
        >
          {projekte.map((projekt, i) => (
            <li key={projekt.id}>
              <Spotlight className="group sd-settle rounded-3xl border border-primary-soft/15 bg-card transition-colors hover:border-primary-soft/40">
                <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
                  <div className={i % 2 ? "lg:order-2" : undefined}>
                    <p className="text-base font-medium text-primary-soft 3xl:text-lg">
                      {projekt.kunde}
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-5xl 3xl:text-6xl">
                      <Link
                        href={`/projekte/${projekt.slug}` as never}
                        className="outline-none after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-ring"
                      >
                        {projekt.title}
                      </Link>
                    </h2>
                    <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl 3xl:text-2xl">
                      {projekt.summary}
                    </p>
                    <span
                      aria-hidden="true"
                      className="mt-8 inline-flex items-center gap-3 text-lg font-medium text-primary-soft"
                    >
                      <span className="decoration-2 underline-offset-8 group-hover:underline">
                        Zum Projekt
                      </span>
                      <svg
                        viewBox="0 0 28 28"
                        className="size-5 fill-none stroke-current stroke-2 transition-transform duration-200 ease-out [stroke-linecap:round] [stroke-linejoin:round] group-hover:translate-x-1"
                      >
                        <path d="M5 14h17M16 8l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                  <StarChart
                    chartKey={projekt.path}
                    className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
              </Spotlight>
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
