import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";

import { lexical } from "@/cms/rich-text/build";
import { firstParagraph } from "@/cms/rich-text/text";
import { ClosingCta } from "@/components/site/closing-cta";
import { Way } from "@/components/site/content-blocks";
import { Doors } from "@/components/site/doors";
import { fraktur } from "@/components/site/fraktur";
import { StarCta } from "@/components/site/star-cta";
import { TechBand } from "@/components/site/tech-band";
import {
  getHomeContent,
  getLeistungenContent,
  getPublishedPages,
  getSiteSettings,
} from "@/data/queries";
import { absoluteUrl, JsonLd, mediaUrl } from "@/lib/seo";

import { MountainHero } from "./_components/mountain-scene";
import { RotatingWord } from "./_components/rotating-word";
import { type Service, ServicesStrata } from "./_components/services-strata";
import { TriangleMotif } from "./_components/triangle-motif";
import styles from "./page.module.css";

// Home page of Schwarzwald Systems: the page „startseite“ (/admin → Seiten → Startseite) with its
// sections and SEO; the five services and their lead come from the page „leistungen“, the button
// label from the site's closing invitation (/admin → Website). `data-cms-zone` marks each part
// for the admin's preview.

// The pages the home page opens doors to, in this order; each door shows its page's own title and
// lead (edited on that page), and a page that is not published is simply left out.
const PREVIEWS = [
  "/ueber-uns/datensouveraenitaet",
  "/branchen/handwerk",
  "/online-shops",
  "/ueber-uns/technologie",
];

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
  const [settings, { sections }, leistungen, pages] = await Promise.all([
    getSiteSettings(),
    getHomeContent(),
    getLeistungenContent(),
    getPublishedPages(),
  ]);
  const doors = PREVIEWS.flatMap((path) => {
    const page = pages.find((p) => p.path === path);
    return page
      ? [
          {
            id: page.id,
            title: page.title,
            path: page.path,
            summary: page.lead || firstParagraph(page.content),
          },
        ]
      : [];
  });
  const services = toServices(leistungen.sections.services);
  const { hero, steps, principles } = sections;
  // Home pages saved before the timeline existed carry no milestones (migration 0012 adds them).
  const milestones = sections.milestones ?? [];
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
                <StarCta label={settings.cta.label} hero />
              </div>
            ) : null}
          </div>
          {/* Above the headline and centred on phones and tablets; from lg up a quiet accent at the
              level of the buttons, leaving the sky above free for the moon. */}
          <TriangleMotif className="order-first w-56 justify-self-center sm:w-68 lg:order-none lg:mb-2 lg:w-[clamp(240px,19.5vw,320px)] lg:self-end lg:justify-self-auto 3xl:w-[clamp(320px,15vw,390px)]" />
        </div>
      </MountainHero>

      <TechBand title={sections.techTitle ?? "Womit wir bauen"} />

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

      {/* The E-Rechnung's dates as one line through time: a dot on the rule for each, drawn in as
          the section enters, the dates following one after another. */}
      {milestones.length > 0 ? (
        <section
          id="e-rechnung"
          aria-labelledby="e-rechnung-titel"
          className="border-t"
          data-cms-zone="e-rechnung"
        >
          <div className="page-container py-20 sm:py-28">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16">
              <h2
                id="e-rechnung-titel"
                className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl"
              >
                {sections.eRechnungTitle}
              </h2>
              {sections.eRechnungLead ? (
                <p className="max-w-xl text-pretty text-muted-foreground lg:text-lg 3xl:text-xl">
                  {sections.eRechnungLead}
                </p>
              ) : null}
            </div>
            <div className="relative mt-14">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-[6px] hidden h-px sd-draw-x bg-primary-soft/40 lg:block"
              />
              <ol className="grid sd-stagger gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                {milestones.map((milestone, index) => (
                  <li
                    key={milestone.id}
                    style={{ "--i": index } as CSSProperties}
                    className="relative border-t border-primary-soft/40 pt-8 lg:border-t-0"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -top-[7px] left-0 size-3.5 rounded-full border-2 border-primary-soft bg-background lg:top-0"
                    />
                    <p className="font-mono text-sm text-primary-soft tabular-nums 3xl:text-base">
                      {milestone.date}
                    </p>
                    <h3 className="mt-2 text-xl font-medium tracking-tight 3xl:text-2xl">
                      {milestone.title}
                    </h3>
                    <p className="mt-3 text-pretty text-muted-foreground 3xl:text-lg">
                      {milestone.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-10 text-right text-sm">
              <Link
                href={"/e-rechnung" as never}
                className="font-medium text-primary-soft hover:underline"
              >
                Alles zur E-Rechnung →
              </Link>
            </p>
          </div>
        </section>
      ) : null}

      {/* The way of working as one way up the mountain, as on the content pages. */}
      {steps.length > 0 ? (
        <Way
          id="vorgehen"
          title={sections.stepsTitle}
          zone="vorgehen"
          steps={steps.map((step, i) => ({
            number: i + 1,
            title: step.title,
            body: lexical([{ kind: "p", text: step.text }]),
          }))}
        />
      ) : null}

      {doors.length > 0 ? (
        <section aria-labelledby="mehr-titel" className="border-t" data-cms-zone="vorschau">
          <div className="page-container py-20 sm:py-28">
            <h2
              id="mehr-titel"
              className="mb-12 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl"
            >
              {sections.previewsTitle ?? "Mehr über uns"}
            </h2>
            <Doors doors={doors} heading="h3" />
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
            {/* Each principle a large line of its own, its rule drawn in as it comes into view. */}
            <dl className="mt-12">
              {principles.map((principle) => (
                <div
                  key={principle.title}
                  className="relative grid gap-3 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px sd-draw-x bg-primary-soft/40"
                  />
                  <dt className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl">
                    {principle.title}
                  </dt>
                  <dd className="max-w-xl text-lg text-pretty text-muted-foreground lg:pt-2 3xl:text-xl">
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
