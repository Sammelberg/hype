import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";

import { ClosingCta } from "@/components/site/closing-cta";
import { getHomeContent, getLeistungenContent, getSiteSettings } from "@/data/queries";
import { absoluteUrl, JsonLd, mediaUrl } from "@/lib/seo";

import { HeroCta } from "./_components/hero-cta";
import { MountainHero } from "./_components/mountain-scene";
import { RotatingWord } from "./_components/rotating-word";
import { type Service, ServicesStrata } from "./_components/services-strata";
import { TriangleMotif } from "./_components/triangle-motif";
import styles from "./page.module.css";

// Blackletter initials of the hero headline and its call to action: Kanzleyrath, Peter Wiegel's
// Kanzlei face (OFL, licence beside the file), the owner's pick from the board (2026-09-29).
const fraktur = localFont({
  src: "./_fonts/kanzleyrath.ttf",
  variable: "--font-fraktur",
  display: "swap",
  fallback: ["serif"],
});

// Home page of Schwarzwald Systems: the page „startseite“ (/admin → Seiten → Startseite) with its
// sections and SEO; the five services and their lead come from the page „leistungen“, the button
// label from the site's closing invitation (/admin → Website). `data-cms-zone` marks each part
// for the admin's preview.

// „A, B, C und D“: what a screen reader hears instead of the changing word.
const listOf = (words: string[]) =>
  words.length > 1 ? `${words.slice(0, -1).join(", ")} und ${words.at(-1)}` : (words[0] ?? "");

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

// The services of the page „leistungen“, mapped onto services-strata.tsx's Service type.
function toServices(
  services: Awaited<ReturnType<typeof getLeistungenContent>>["sections"]["services"],
): readonly Service[] {
  return services.map((s) => ({
    title: s.title,
    short: s.short,
    glyph: s.glyph,
    text: s.text,
    examples: (s.examples ?? []).map((e) => e.text),
    href: `/leistungen/${s.slug}`,
  }));
}

export default async function HomePage() {
  const [settings, { sections }, leistungen] = await Promise.all([
    getSiteSettings(),
    getHomeContent(),
    getLeistungenContent(),
  ]);
  const services = toServices(leistungen.sections.services);
  const { hero, steps, principles } = sections;
  const words = (hero?.words ?? []).map((w) => w.word);
  const headline = hero?.headline ?? "";

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
          <div className={fraktur.variable}>
            {/* Bold, with a 1.5× solid initial (page.module.css). From lg up the size follows the
                width to 72px, so the longest rotating word, which never breaks, keeps clear of
                the triangles. */}
            <h1
              id="start-titel"
              className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-[clamp(4rem,6.2vw,4.5rem)]/none 3xl:max-w-6xl 3xl:text-8xl"
            >
              {/* A span, not ::first-letter: Chrome ignores text-stroke on ::first-letter. */}
              <span className={styles.initial}>{headline.charAt(0)}</span>
              {headline.slice(1)}{" "}
              {/* A grid of its own, so it takes its own line: no space needed after it. */}
              {words.length > 0 ? (
                <RotatingWord words={words} label={listOf(words)} className="text-primary-soft" />
              ) : null}
              {hero?.headlineEnd}
            </h1>
            {/* One short line and one action: the scene around it already carries a lot. */}
            {hero?.lead ? (
              <p className="mt-6 max-w-4xl text-lg text-pretty text-muted-foreground sm:text-xl 3xl:max-w-5xl 3xl:text-2xl">
                {hero.lead}
              </p>
            ) : null}
            {settings.cta?.label ? (
              <div className="mt-10">
                <HeroCta label={settings.cta.label} />
              </div>
            ) : null}
          </div>
          {/* Above the headline and centred on phones and tablets; from lg up a quiet accent at the
              level of the buttons, leaving the sky above free for the moon. */}
          <TriangleMotif className="order-first w-56 justify-self-center sm:w-68 lg:order-none lg:mb-2 lg:w-[clamp(240px,19.5vw,320px)] lg:self-end lg:justify-self-auto 3xl:w-[clamp(320px,15vw,390px)]" />
        </div>
      </MountainHero>

      {services.length > 0 ? (
        <>
          <ServicesStrata
            id="leistungen"
            title={sections.servicesTitle}
            intro={leistungen.page?.lead ?? undefined}
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
        <section
          id="vorgehen"
          aria-labelledby="vorgehen-titel"
          className="border-t bg-card"
          data-cms-zone="vorgehen"
        >
          <div className="page-container py-20 sm:py-28">
            <h2
              id="vorgehen-titel"
              className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl"
            >
              {sections.stepsTitle}
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
        <section
          aria-labelledby="grundsaetze-titel"
          className="border-t"
          data-cms-zone="grundsaetze"
        >
          <div className="page-container py-20 sm:py-28">
            <h2
              id="grundsaetze-titel"
              className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl"
            >
              {sections.principlesTitle}
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

      <ClosingCta />
    </main>
  );
}
