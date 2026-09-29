import type { Metadata } from "next";

import Link from "next/link";

import { pagePath } from "@/cms/collections/Pages";
import { ClosingCta } from "@/components/site/closing-cta";
import { PageHeader } from "@/components/site/page-header";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { RichText } from "@/components/site/rich-text";
import { ServiceGlyph } from "@/components/site/service-glyphs";
import { getPayloadClient } from "@/data/payload";
import { getChildPages, getPageByPath, getSiteSettings } from "@/data/queries";
import { redirectOrNotFound } from "@/data/redirect-or-not-found";
import { pageTrail } from "@/lib/breadcrumbs";
import { firstParagraph } from "@/lib/rich-text";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string[] }> };

export async function generateStaticParams() {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "pages",
    where: { _status: { equals: "published" } },
    limit: 1000,
    depth: 0,
  });
  return (
    docs
      .map((doc) => pagePath(doc as unknown as Record<string, unknown>))
      // `/` is rendered by app/(frontend)/page.tsx; `/leistungen` by its own route (the Pages doc
      // there only exists as a nested-docs anchor for the 5 child pages) — not by this catch-all.
      .filter((path): path is string => Boolean(path) && path !== "/" && path !== "/leistungen")
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
    path: pagePath(page as unknown as Record<string, unknown>) ?? "/",
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
  const [children, settings] = await Promise.all([getChildPages(page.id), getSiteSettings()]);
  // A service's page lists the other services beside its text.
  const otherServices = path.startsWith("/leistungen/")
    ? (settings.services ?? []).filter((service) => `/leistungen/${service.slug}` !== path)
    : [];

  return (
    <main>
      <PageHeader
        title={page.title}
        lead={page.lead}
        // Top-level pages sit directly under the home page; a trail there would add nothing.
        breadcrumbs={trail.length > 2 ? <PageBreadcrumbs trail={trail} /> : undefined}
        horizonKey={path}
      />

      <div
        className={cn(
          "page-container grid gap-16 py-16 sm:py-24",
          otherServices.length > 0 &&
            "lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-24 3xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]",
        )}
      >
        <RichText data={page.content} className="prose-lg max-w-prose 3xl:prose-xl" />
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

      {children.length > 0 ? (
        <section aria-labelledby="unterseiten-titel" className="border-t">
          <div className="page-container py-16 sm:py-24">
            <h2
              id="unterseiten-titel"
              className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl"
            >
              Mehr zu „{page.title}“
            </h2>
            <ul className="mt-10 grid gap-x-16 md:grid-cols-2">
              {children.map((child) => {
                const summary = child.lead || firstParagraph(child.content);
                return (
                  <li key={child.id} className="border-t py-8">
                    <h3 className="text-2xl font-medium tracking-tight 3xl:text-3xl">
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
          </div>
        </section>
      ) : null}

      {LEGAL.has(page.slug ?? "") ? null : <ClosingCta />}
    </main>
  );
}
