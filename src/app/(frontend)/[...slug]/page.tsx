import type { Metadata } from "next";

import { ClosingCta } from "@/components/site/closing-cta";
import { Doors } from "@/components/site/doors";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { PageHeader } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { getChildPages, getPageByPath, getPublishedPagePaths } from "@/data/queries";
import { redirectOrNotFound } from "@/data/redirect-or-not-found";
import { pageTrail } from "@/lib/breadcrumbs";
import { ROUTED_PATHS } from "@/cms/content/page-tree";
import { firstParagraph } from "@/cms/rich-text/text";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string[] }> };

export async function generateStaticParams() {
  const paths = await getPublishedPagePaths();
  return (
    paths
      // `/`, /projekte and /kontakt have routes of their own that render their page.
      .filter((path) => !ROUTED_PATHS.has(path))
      .map((path) => ({ slug: path.split("/").filter(Boolean) }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageByPath(slug);
  if (!page) return {};
  return buildMetadata({
    meta: page.meta,
    fallbackTitle: page.title,
    fallbackDescription: page.lead || firstParagraph(page.content),
    path: page.path,
  });
}

// Legal pages end with their text; everything else invites an inquiry.
const LEGAL = new Set(["impressum", "datenschutz"]);

// A CMS page: header, its text as one column of prose, the pages below it as cards.
export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageByPath(slug);
  if (!page) return redirectOrNotFound(`/${slug.join("/")}`);
  const trail = pageTrail(page.breadcrumbs);
  const path = `/${slug.join("/")}`;
  const children = await getChildPages(page.id);
  const legal = LEGAL.has(page.slug);
  const doors = children.map((child) => ({
    id: child.id,
    title: child.title,
    path: `${path}/${child.slug}`,
    summary: child.lead || firstParagraph(child.content),
  }));

  return (
    <main>
      <PageHeader
        title={page.title}
        lead={page.lead}
        // Top-level pages sit directly under the home page; a trail there would add nothing.
        breadcrumbs={trail.length > 2 ? <PageBreadcrumbs trail={trail} /> : undefined}
      />

      {page.content ? (
        <div className="page-container py-16 sm:py-24" data-cms-zone="text">
          <RichText
            data={page.content}
            // Long addresses and legal compounds break instead of widening the page.
            className="prose-lg max-w-prose break-words hyphens-auto"
          />
        </div>
      ) : null}

      {doors.length > 0 ? (
        <section aria-labelledby="unterseiten-titel" className="border-t">
          <div className="page-container py-16 sm:py-24">
            <h2 id="unterseiten-titel" className="mb-8 text-2xl font-semibold tracking-tight">
              Weiterlesen
            </h2>
            <Doors doors={doors} heading="h3" />
          </div>
        </section>
      ) : null}

      {legal ? null : <ClosingCta />}
    </main>
  );
}
