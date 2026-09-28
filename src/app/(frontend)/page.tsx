import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getHomePage, getSiteSettings } from "@/data/queries";
import { absoluteUrl, JsonLd, mediaUrl } from "@/lib/seo";

import { MountainHero } from "./_components/mountain-scene";
import { type Service, ServicesStrata } from "./_components/services-strata";
import { TriangleMotif } from "./_components/triangle-motif";

// Home page of Schwarzwald Systems. The sections below are written in code; the Payload page with
// the slug „startseite“ still supplies the SEO tab (title, description, share image).
export async function generateMetadata(): Promise<Metadata> {
  const [home, settings] = await Promise.all([getHomePage(), getSiteSettings()]);
  const image = mediaUrl(home?.meta?.image ?? null, "hero");
  return {
    ...(home?.meta?.title ? { title: { absolute: home.meta.title } } : {}),
    description: home?.meta?.description || settings.description || undefined,
    alternates: { canonical: "/" },
    ...(image ? { openGraph: { images: [{ url: image }] } } : {}),
  };
}

// Services, steps and principles are edited under /admin → Website-Einstellungen; this maps the
// CMS shape onto services-strata.tsx's Service type (unrelated in-progress component, left as is).
function toServices(settings: Awaited<ReturnType<typeof getSiteSettings>>): readonly Service[] {
  return (settings.services ?? []).map((s) => ({
    title: s.title,
    short: s.short,
    glyph: s.glyph,
    text: s.text,
    examples: (s.examples ?? []).map((e) => e.text),
  }));
}

export default async function HomePage() {
  const settings = await getSiteSettings();
  const services = toServices(settings);
  const steps = settings.steps ?? [];
  const principles = settings.principles ?? [];

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

      <MountainHero labelledBy="start-titel">
        <div className="page-container grid items-center gap-10 pt-16 pb-20 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div>
            <h1
              id="start-titel"
              className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl 3xl:max-w-6xl 3xl:text-8xl"
            >
              Individuelle Software, die Ihre Abläufe trägt.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl 3xl:max-w-3xl 3xl:text-2xl">
              Aus dem Schwarzwald entwickeln wir Web-Anwendungen, mobile Apps und Schnittstellen für
              mittelständische Unternehmen, deren Prozesse nicht in Standardsoftware passen.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button asChild size="lg">
                <Link href="/kontakt">Projekt anfragen</Link>
              </Button>
              <Link
                href={"/#leistungen" as never}
                className="text-sm font-medium underline decoration-border underline-offset-8 transition-colors duration-150 hover:decoration-foreground"
              >
                Leistungen ansehen
              </Link>
            </div>
          </div>
          {/* Above the headline on phones; from lg up a quiet accent at the level of the buttons,
              leaving the sky above free for the moon. */}
          <TriangleMotif className="order-first w-28 sm:w-32 lg:order-none lg:mb-2 lg:w-[clamp(170px,14vw,230px)] lg:self-end 3xl:w-[clamp(230px,11vw,280px)]" />
        </div>
      </MountainHero>

      {services.length > 0 ? (
        <>
          <ServicesStrata
            id="leistungen"
            title="Was wir entwickeln"
            intro="Von der einzelnen Schnittstelle bis zur kompletten Plattform – geplant für Ihre Abläufe, nicht für einen Standardfall."
            services={services}
          />
          <div className="page-container py-8 text-right text-sm">
            <Link href="/leistungen" className="font-medium text-primary-soft hover:underline">
              Alle Leistungen im Detail →
            </Link>
          </div>
        </>
      ) : null}

      {steps.length > 0 ? (
        <section id="vorgehen" aria-labelledby="vorgehen-titel" className="border-t bg-card">
          <div className="page-container py-20 sm:py-28">
            <h2
              id="vorgehen-titel"
              className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl"
            >
              So arbeiten wir
            </h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {steps.map((step, index) => (
                <li key={step.title} className="border-t border-primary-soft/40 pt-6">
                  <span className="text-sm font-medium text-primary-soft tabular-nums">
                    Schritt {index + 1}
                  </span>
                  <h3 className="mt-2 text-xl font-medium tracking-tight 3xl:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-pretty text-muted-foreground 3xl:text-lg">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {principles.length > 0 ? (
        <section aria-labelledby="grundsaetze-titel" className="border-t">
          <div className="page-container py-20 sm:py-28">
            <h2
              id="grundsaetze-titel"
              className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl"
            >
              Unsere Grundsätze
            </h2>
            <dl className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
              {principles.map((principle) => (
                <div key={principle.title}>
                  <dt className="text-xl font-medium tracking-tight 3xl:text-2xl">
                    {principle.title}
                  </dt>
                  <dd className="mt-3 text-pretty text-muted-foreground 3xl:text-lg">
                    {principle.text}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-10 text-right text-sm">
              <Link
                href={"/ueber-uns/arbeitsweise" as never}
                className="font-medium text-primary-soft hover:underline"
              >
                Mehr zu unserer Arbeitsweise →
              </Link>
            </p>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="anfrage-titel" className="border-t">
        <div className="page-container flex flex-col items-start gap-8 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2
              id="anfrage-titel"
              className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl 3xl:text-6xl"
            >
              Erzählen Sie uns von Ihrem Vorhaben.
            </h2>
            <p className="mt-4 text-lg text-pretty text-muted-foreground 3xl:text-xl">
              Wir melden uns mit einer ersten Einschätzung und einem Vorschlag für das weitere
              Vorgehen.
            </p>
          </div>
          <Button asChild size="lg" variant="outline">
            <Link href="/kontakt">Projekt anfragen</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
