import type { Metadata } from "next";

import { ClosingCta } from "@/components/site/closing-cta";
import { Doors } from "@/components/site/doors";
import { PageHeader } from "@/components/site/page-header";
import { Part } from "@/components/site/part";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { RichText } from "@/components/site/rich-text";
import {
  getChildPages,
  getLeistungenContent,
  getPageByPath,
  getProjekte,
  getPublishedPagePaths,
  getSiteSettings,
} from "@/data/queries";
import { redirectOrNotFound } from "@/data/redirect-or-not-found";
import { pageTrail } from "@/lib/breadcrumbs";
import { ROUTED_PATHS } from "@/cms/content/page-tree";
import { partsOf } from "@/cms/rich-text/parts";
import { shapeParts } from "@/cms/rich-text/shapes";
import { firstParagraph } from "@/cms/rich-text/text";
import { absoluteUrl, buildMetadata, JsonLd } from "@/lib/seo";

import { ContentBlocks, Statement } from "@/components/site/content-blocks";
import { LeistungSections } from "./_components/leistung-sections";

type Props = { params: Promise<{ slug: string[] }> };

export async function generateStaticParams() {
  const paths = await getPublishedPagePaths();
  return (
    paths
      // `/`, /leistungen, /projekte and /kontakt have routes of their own that render their page.
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

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageByPath(slug);
  if (!page) return redirectOrNotFound(`/${slug.join("/")}`);
  const trail = pageTrail(page.breadcrumbs);
  const path = `/${slug.join("/")}`;
  const [children, leistungen, projekte, settings] = await Promise.all([
    getChildPages(page.id),
    getLeistungenContent(),
    getProjekte(),
    getSiteSettings(),
  ]);
  // A service's own page: its sections, the project it points to if that is published.
  const service = page.sections?.kind === "leistung" ? page.sections : null;
  const projekt = service?.projektId
    ? (projekte.find((p) => p.id === service.projektId) ?? null)
    : null;
  // A service's page ends with the other services.
  const otherServices = service
    ? leistungen.sections.services.filter((s) => `/leistungen/${s.slug}` !== path)
    : [];
  const legal = LEGAL.has(page.slug);
  // A content page lays its text out in parts, one per h2, each heading beside its text; legal
  // pages and service pages keep one column of prose.
  const { intro, parts } =
    legal || service ? { intro: page.content, parts: [] } : partsOf(page.content);
  // A page with no parts of its own is an overview: the pages below it are its body.
  const overview = parts.length === 0 && !legal && !service && children.length > 0;
  const doors = children.map((child) => ({
    id: child.id,
    title: child.title,
    path: `${path}/${child.slug}`,
    summary: child.lead || firstParagraph(child.content),
  }));

  return (
    <main>
      {service ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Service",
            name: page.title,
            url: absoluteUrl(page.path),
            ...(page.lead ? { description: page.lead } : {}),
            provider: {
              "@type": "Organization",
              name: settings.siteName,
              url: absoluteUrl("/"),
            },
          }}
        />
      ) : null}
      <PageHeader
        title={page.title}
        lead={page.lead}
        // Top-level pages sit directly under the home page; a trail there would add nothing.
        breadcrumbs={trail.length > 2 ? <PageBreadcrumbs trail={trail} /> : undefined}
        horizonKey={path}
      />

      {legal ? (
        // Legal pages: one column of prose, a hairline under the header showing how far in.
        <>
          <span
            aria-hidden="true"
            className="fixed inset-x-0 top-header z-40 sd-progress h-0.5 origin-left bg-primary-soft"
          />
          {intro ? (
            <div className="page-container py-16 sm:py-24" data-cms-zone="text">
              <RichText
                data={intro}
                // Long addresses and legal compounds break instead of widening the page.
                className="prose-lg max-w-prose break-words hyphens-auto 3xl:prose-xl"
              />
            </div>
          ) : null}
        </>
      ) : service ? (
        intro ? (
          // A service's text opens its page at the size of a lead.
          <div className="page-container py-16 sm:py-24" data-cms-zone="text">
            <RichText data={intro} className="prose-xl max-w-prose 3xl:prose-2xl" />
          </div>
        ) : null
      ) : intro ? (
        <div data-cms-zone={parts.length > 0 ? undefined : "text"}>
          <Statement intro={intro} mapKey={path} />
        </div>
      ) : null}

      {parts.length > 0 ? <ContentBlocks blocks={shapeParts(parts)} /> : null}

      {service ? (
        <LeistungSections sections={service} projekt={projekt} others={otherServices} />
      ) : null}

      {overview ? (
        // An overview's pages are its body: a door for each.
        <section className="border-t">
          <div className="page-container py-20 sm:py-28">
            <Doors doors={doors} label={page.title} large />
          </div>
        </section>
      ) : children.length > 0 ? (
        <Part id="unterseiten-titel" title="Weiterlesen">
          <Doors doors={doors} />
        </Part>
      ) : null}

      {legal ? null : <ClosingCta />}
    </main>
  );
}
