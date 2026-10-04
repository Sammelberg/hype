import type { Metadata } from "next";
import Link from "next/link";

import { ClosingCta } from "@/components/site/closing-cta";
import { Faq } from "@/components/site/faq";
import { buttonVariants } from "@/components/ui/button";
import { getHomeContent, getSiteSettings } from "@/data/queries";
import { absoluteUrl, JsonLd, mediaUrl } from "@/lib/seo";

// Home page: the page „startseite“ (/admin → Seiten → Startseite) with its sections and SEO, the
// button label from the site's closing invitation (/admin → Website). Plain on purpose: every
// project designs its own. `data-cms-zone` marks each part for the admin's preview, and each part
// has its card in the home editor.

export async function generateMetadata(): Promise<Metadata> {
  const [{ page: home }, settings] = await Promise.all([getHomeContent(), getSiteSettings()]);
  const image = mediaUrl(home?.meta?.image ?? null, "hero");
  return {
    ...(home?.meta?.title ? { title: { absolute: home.meta.title } } : {}),
    description: home?.meta?.description || settings.description || undefined,
    alternates: { canonical: "/" },
    ...(image ? { openGraph: { images: [{ url: image }] } } : {}),
  };
}

const H2 = "max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl";

export default async function HomePage() {
  const [settings, { sections }] = await Promise.all([getSiteSettings(), getHomeContent()]);
  const { hero, steps, principles, faq } = sections;

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: settings.siteName,
          url: absoluteUrl("/"),
          ...(settings.description ? { description: settings.description } : {}),
        }}
      />

      <section aria-labelledby="start-titel" className="border-b" data-cms-zone="kopf">
        <div className="page-container py-20 sm:py-32">
          <h1
            id="start-titel"
            className="max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-6xl"
          >
            {hero.headline}
          </h1>
          {hero.lead ? (
            <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
              {hero.lead}
            </p>
          ) : null}
          {settings.cta?.label ? (
            <Link href="/kontakt" className={buttonVariants({ size: "lg", className: "mt-10" })}>
              {settings.cta.label}
            </Link>
          ) : null}
        </div>
      </section>

      {steps.length > 0 ? (
        <section aria-labelledby="vorgehen-titel" className="border-b" data-cms-zone="vorgehen">
          <div className="page-container py-16 sm:py-24">
            <h2 id="vorgehen-titel" className={H2}>
              {sections.stepsTitle}
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <li key={step.id}>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-xl font-medium tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-pretty text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {principles.length > 0 ? (
        <section
          aria-labelledby="grundsaetze-titel"
          className="border-b"
          data-cms-zone="grundsaetze"
        >
          <div className="page-container py-16 sm:py-24">
            <h2 id="grundsaetze-titel" className={H2}>
              {sections.principlesTitle}
            </h2>
            <dl className="mt-10 grid gap-x-16 gap-y-8 lg:grid-cols-2">
              {principles.map((principle) => (
                <div key={principle.id}>
                  <dt className="text-xl font-semibold tracking-tight">{principle.title}</dt>
                  <dd className="mt-2 text-pretty text-muted-foreground">{principle.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      <Faq id="fragen-titel" title={sections.faqTitle} items={faq} zone="fragen" />

      <ClosingCta />
    </main>
  );
}
