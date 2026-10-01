import type { Metadata } from "next";
import Link from "next/link";

import { ClosingCta } from "@/components/site/closing-cta";
import { Faq } from "@/components/site/faq";
import { PageHeader } from "@/components/site/page-header";
import { ServiceGlyph } from "@/components/site/service-glyphs";
import { getLeistungenContent } from "@/data/queries";
import { buildMetadata } from "@/lib/seo";

// The page „leistungen“ (/admin → Seiten → Leistungen): its lead and SEO, the five services and
// the FAQ from its sections. The pages below it hold each service's own text.
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getLeistungenContent();
  return buildMetadata({
    meta: page?.meta,
    fallbackTitle: page?.title || "Leistungen",
    fallbackDescription: page?.lead,
    path: "/leistungen",
  });
}

export default async function LeistungenIndex() {
  const { page, sections } = await getLeistungenContent();
  const { services, faq } = sections;

  return (
    <main>
      <PageHeader title={page?.title || "Leistungen"} lead={page?.lead} horizonKey="/leistungen" />

      {services.length > 0 ? (
        <ul aria-label="Leistungen" className="page-container" data-cms-zone="leistungen">
          {services.map((service) => (
            <li
              key={service.id ?? service.slug}
              className="grid gap-x-10 gap-y-6 border-b py-12 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:py-16 lg:grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,22rem)] lg:gap-x-16 3xl:grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,26rem)]"
            >
              <ServiceGlyph
                name={service.glyph}
                className="size-14 text-primary-soft sm:size-18 lg:size-22 3xl:size-26"
              />
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl">
                  <Link
                    href={`/leistungen/${service.slug}` as never}
                    className="decoration-primary-soft decoration-2 underline-offset-8 hover:underline"
                  >
                    {service.title}
                  </Link>
                </h2>
                <p className="mt-4 text-lg text-pretty text-muted-foreground 3xl:text-xl">
                  {service.text}
                </p>
              </div>
              {service.examples?.length ? (
                <div className="sm:col-start-2 lg:col-start-auto lg:pt-2">
                  <p className="text-sm font-medium text-primary-soft">Zum Beispiel</p>
                  <ul className="mt-3 space-y-2 text-pretty">
                    {service.examples.map((example) => (
                      <li key={example.id ?? example.text} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-[0.6em] size-1.5 shrink-0 rotate-45 bg-primary-soft"
                        />
                        {example.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <Faq id="faq-titel" title="Häufige Fragen" items={faq} zone="fragen" />

      <ClosingCta />
    </main>
  );
}
