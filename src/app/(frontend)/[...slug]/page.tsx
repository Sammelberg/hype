import type { Metadata } from "next";

import Link from "next/link";

import { ClosingCta } from "@/components/site/closing-cta";
import { PageHeader } from "@/components/site/page-header";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { RichText } from "@/components/site/rich-text";
import { ServiceGlyph } from "@/components/site/service-glyphs";
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
import { firstParagraph } from "@/cms/rich-text/text";
import { absoluteUrl, buildMetadata, JsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

import { LeistungSections } from "./_components/leistung-sections";
import { Part } from "./_components/part";

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
  // A service's page lists the other services beside its text.
  const otherServices = path.startsWith("/leistungen/")
    ? leistungen.sections.services.filter((service) => `/leistungen/${service.slug}` !== path)
    : [];
  const legal = LEGAL.has(page.slug);
  // A content page lays its text out in parts, one per h2, each heading beside its text; legal
  // pages and service pages keep one column of prose.
  const { intro, parts } =
    legal || service ? { intro: page.content, parts: [] } : partsOf(page.content);
  // A page with no parts of its own is an overview: the pages below it are its body.
  const overview = parts.length === 0 && !legal && !service && children.length > 0;

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

      {intro || otherServices.length > 0 ? (
        <div
          className={cn(
            "page-container grid gap-16 py-16 sm:py-24",
            otherServices.length > 0 &&
              "lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-24 3xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]",
          )}
        >
          <div data-cms-zone={parts.length > 0 ? undefined : "text"}>
            <RichText data={intro} className="prose-lg max-w-prose 3xl:prose-xl" />
          </div>
          {otherServices.length > 0 ? (
            <nav aria-labelledby="weitere-leistungen" className="lg:border-l lg:pl-12">
              <h2 id="weitere-leistungen" className="text-sm font-medium text-primary-soft">
                Weitere Leistungen
              </h2>
              <ul className="mt-4">
                {otherServices.map((service) => (
                  <li key={service.id ?? service.slug}>
                    <Link
                      href={`/leistungen/${service.slug}` as never}
                      className="flex items-center gap-4 py-3 text-lg tracking-tight transition-colors hover:text-primary-soft"
                    >
                      <ServiceGlyph
                        name={service.glyph}
                        className="size-8 shrink-0 text-primary-soft"
                      />
                      {service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      ) : null}

      {parts.length > 0 ? (
        <div data-cms-zone="text">
          {parts.map((part, i) => (
            <Part key={`${i}-${part.title}`} id={`abschnitt-${i + 1}`} title={part.title}>
              <RichText data={part.body} className="prose-lg max-w-prose 3xl:prose-xl" />
            </Part>
          ))}
        </div>
      ) : null}

      {service ? <LeistungSections sections={service} projekt={projekt} /> : null}

      {overview ? (
        // An overview's pages are its body: one wide row each, its title and lead.
        <ul aria-label={page.title} className="page-container">
          {children.map((child) => {
            const summary = child.lead || firstParagraph(child.content);
            return (
              <li
                key={child.id}
                className="grid gap-x-16 gap-y-4 border-t py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
              >
                <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl">
                  <Link
                    href={`${path}/${child.slug}` as never}
                    className="decoration-primary-soft decoration-2 underline-offset-8 hover:underline"
                  >
                    {child.title}
                  </Link>
                </h2>
                {summary ? (
                  <p className="max-w-prose text-xl text-pretty text-muted-foreground lg:pt-2 3xl:text-2xl">
                    {summary}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : children.length > 0 ? (
        <Part id="unterseiten-titel" title="Weiterlesen">
          <ul className="grid gap-x-16 md:grid-cols-2">
            {children.map((child) => {
              const summary = child.lead || firstParagraph(child.content);
              return (
                <li key={child.id} className="border-t border-primary-soft/40 pt-6 pb-8">
                  <h3 className="text-2xl font-medium tracking-tight text-balance 3xl:text-3xl">
                    <Link
                      href={`${path}/${child.slug}` as never}
                      className="decoration-primary-soft decoration-2 underline-offset-8 hover:underline"
                    >
                      {child.title}
                    </Link>
                  </h3>
                  {summary ? (
                    <p className="mt-3 line-clamp-3 max-w-prose text-lg text-pretty text-muted-foreground">
                      {summary}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Part>
      ) : null}

      {legal ? null : <ClosingCta />}
    </main>
  );
}
