import type { Metadata } from "next";

import { ClosingCta } from "@/components/site/closing-cta";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { PageHeader } from "@/components/site/page-header";
import { ContentBlocks, Statement } from "@/components/site/content-blocks";
import { StarChart } from "@/components/site/star-chart";
import { getProjekte, getProjektBySlug } from "@/data/queries";
import { redirectOrNotFound } from "@/data/redirect-or-not-found";
import { partsOf } from "@/cms/rich-text/parts";
import { shapeParts } from "@/cms/rich-text/shapes";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projekte = await getProjekte();
  return projekte.map((projekt) => ({ slug: projekt.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const projekt = await getProjektBySlug(slug);
  if (!projekt) return {};
  return buildMetadata({
    meta: projekt.meta,
    fallbackTitle: projekt.title,
    fallbackDescription: projekt.summary,
    path: projekt.path,
  });
}

export default async function ProjektPage({ params }: Props) {
  const { slug } = await params;
  const projekt = await getProjektBySlug(slug);
  if (!projekt) return redirectOrNotFound(`/projekte/${slug}`);

  const path = projekt.path;
  // Like a content page: the text before the first h2 as a statement, then its parts in their shapes.
  const { intro, parts } = partsOf(projekt.content);

  return (
    <main>
      <PageHeader
        title={projekt.title}
        kicker={projekt.kunde}
        lead={projekt.summary}
        breadcrumbs={
          <PageBreadcrumbs
            trail={[
              { name: "Startseite", path: "/" },
              { name: "Projekte", path: "/projekte" },
              { name: projekt.title, path },
            ]}
          />
        }
        horizonKey={path}
        // The project's own constellation, the one its tile shows on /projekte.
        scene={
          <div className="page-container mt-10 pb-12 sm:mt-14 sm:pb-16">
            <div className="rounded-3xl border border-primary-soft/15 bg-[radial-gradient(80%_120%_at_50%_0%,oklch(0.2_0.05_260),var(--card))] px-6 py-10 sm:px-16 sm:py-14">
              <StarChart chartKey={path} className="mx-auto max-w-4xl" />
            </div>
          </div>
        }
      />
      {/* How far into the case study, as a hairline under the header. */}
      <span
        aria-hidden="true"
        className="fixed inset-x-0 top-header z-40 sd-progress h-0.5 origin-left bg-primary-soft"
      />
      {intro ? (
        <div data-cms-zone={parts.length > 0 ? undefined : "text"}>
          <Statement intro={intro} />
        </div>
      ) : null}
      {parts.length > 0 ? <ContentBlocks blocks={shapeParts(parts)} /> : null}
      <ClosingCta />
    </main>
  );
}
