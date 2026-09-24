import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { projectPath } from "@/cms/collections/Projects";
import { firstParagraph } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import { absoluteUrl, JsonLd, mediaUrl } from "@/lib/seo";
import { getPageByPath, getPublishedProjects, getSiteSettings } from "@/data/queries";

import { FactCounters } from "./_components/fact-counters";
import { HeroName } from "./_components/hero-name";
import { Manifesto } from "./_components/manifesto";
import { Marquee } from "./_components/marquee";
import { HeroVideo } from "./_components/hero-video";
import { HomeMotion } from "./_components/home-motion";
import { Magnetic } from "./_components/magnetic";
import { ProjectConfigurator } from "./_components/project-configurator";
import { ProjectIndex } from "./_components/project-index";
import { ScrollStatement } from "./_components/scroll-statement";
import { SpotlightLink } from "./_components/spotlight-link";
import { TiltCard } from "./_components/tilt-card";

const ABOUT_PATH = "/ueber-mich";

export default async function HomePage() {
  const [settings, projects, about] = await Promise.all([
    getSiteSettings(),
    getPublishedProjects(),
    getPageByPath(ABOUT_PATH.slice(1).split("/")),
  ]);
  const name = settings.ownerName || settings.siteName || "Portfolio";
  const hero = settings.hero ?? {};
  const heroLines = hero.headline?.trim()
    ? hero.headline
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : name.split(/\s+/).filter(Boolean);
  const heroIntro = hero.intro || settings.tagline;
  const heroLinks = hero.links?.length
    ? hero.links
    : [{ label: "Projekte ansehen", href: "/#projekte", id: null }];
  const aboutText = firstParagraph(about?.content);
  const topics = [...new Set(projects.flatMap((p) => p.tags ?? []))];
  const clientLogos = (settings.clients ?? []).flatMap((client) => {
    const logo = typeof client.logo === "object" ? client.logo : null;
    const src = mediaUrl(logo);
    if (!logo?.width || !logo.height || !src) return [];
    // Optical sizing: wide wordmarks get lower, compact marks taller, so all read at a similar weight.
    const scale = Math.min(1.4, Math.max(0.55, Math.sqrt(2.5 / (logo.width / logo.height))));
    const key = client.id ?? client.name;
    return [{ key, name: client.name, src, width: logo.width, height: logo.height, scale }];
  });
  // The pinned gallery shows the featured projects; with fewer than two it shows all of them.
  const featured = projects.filter((p) => p.featured);
  const gallery = featured.length >= 2 ? featured : projects;
  const clients = new Set(projects.map((p) => p.client).filter(Boolean));
  const facts = [
    { value: projects.length, label: projects.length === 1 ? "Projekt" : "Projekte" },
    { value: clients.size, label: clients.size === 1 ? "Kunde" : "Kunden" },
    { value: topics.length, label: topics.length === 1 ? "Thema" : "Themen" },
  ].filter((fact) => fact.value > 0);
  const services = settings.services ?? [];
  const steps = settings.process ?? [];
  const faq = settings.faq ?? [];
  const manifesto = (settings.manifesto?.phrases ?? []).map((p) => p.text).filter(Boolean);

  return (
    <HomeMotion>
      <main>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Person",
            name: settings.ownerName,
            url: absoluteUrl("/"),
            ...(settings.socialLinks?.length
              ? { sameAs: settings.socialLinks.map((s) => s.url) }
              : {}),
          }}
        />

        {/* Hero bento, wider than the page shell; on xl it fills the screen below the header
            (hero-bento in globals.css) and the topic marquee follows right after. The showreel
            column is sized to a 16:9 frame of the top row. Below: two equal link cards across the full width.
            Each title line rises out of its own mask on first paint and the cards settle in after it
            (animate-card-in); surfaces, grain, title ink and the link spotlight are in globals.css. */}
        <section
          data-hero
          className="mx-auto grid w-full max-w-[160rem] gap-fib-sm px-gutter pt-fib-xs pb-fib-md md:grid-cols-3 xl:hero-bento"
        >
          <div className="@container hero-grain flex animate-card-in flex-col justify-between gap-fib-md overflow-hidden rounded-3xl border hero-surface p-fib-md sm:p-fib-lg md:col-span-3 xl:[container-type:size] xl:col-span-2 xl:gap-fib-sm 2xl:gap-fib-md">
            {hero.eyebrow ? (
              <p className="flex w-fit animate-fade-in items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
                {hero.eyebrow}
              </p>
            ) : null}
            <HeroName
              lines={heroLines}
              className="text-[clamp(2.5rem,15.5cqi,10rem)] leading-[0.88] uppercase xl:text-[min(15.5cqi,16cqh)]"
            />
            {heroIntro ? (
              <p
                data-hero-fade
                className="max-w-xl animate-fade-in text-base text-pretty text-muted-foreground [animation-delay:600ms] sm:text-lg xl:text-sm 2xl:text-lg"
              >
                {heroIntro}
              </p>
            ) : null}
          </div>

          <HeroVideo
            src="/video/showreel.mp4"
            poster="/video/showreel-poster.webp"
            className="animate-card-in [animation-delay:120ms] md:col-span-3 xl:col-span-1 xl:aspect-auto"
          />

          <div className="grid gap-fib-sm sm:grid-cols-2 md:col-span-3">
            {heroLinks.map((link, i) => (
              <SpotlightLink
                key={link.id ?? link.href}
                href={link.href as never}
                style={{ animationDelay: `${220 + i * 80}ms` }}
                className="group/cta hero-spotlight flex min-h-fib-3xl animate-card-in items-center justify-between gap-fib-md rounded-3xl border hero-surface p-fib-md transition-[scale] duration-150 ease-(--ease-out) active:scale-[0.99] sm:p-fib-lg xl:min-h-0"
              >
                <span className="text-xl font-semibold tracking-tight text-balance sm:text-2xl xl:text-xl 2xl:text-2xl">
                  {link.label}
                </span>
                <span
                  aria-hidden
                  className="grid size-12 shrink-0 place-items-center rounded-full border border-foreground/25 bg-foreground/[0.03] transition-[scale,color,background-color,border-color] duration-200 ease-(--ease-out) group-hover/cta:scale-110 group-hover/cta:border-primary group-hover/cta:bg-primary group-hover/cta:text-primary-foreground group-focus-visible/cta:border-primary group-focus-visible/cta:bg-primary group-focus-visible/cta:text-primary-foreground"
                >
                  <ArrowUpRight className="size-5 transition-transform duration-200 ease-(--ease-out) group-hover/cta:rotate-45" />
                </span>
              </SpotlightLink>
            ))}
          </div>
        </section>

        {/* Band below the hero: the client logos, or the project topics while none are set. */}
        {clientLogos.length > 0 ? (
          <section aria-labelledby="kunden-titel">
            <h2 id="kunden-titel" className="sr-only">
              Kunden
            </h2>
            <Marquee
              label="Kunden"
              items={clientLogos.map((logo) => ({
                key: logo.key,
                content: (
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={logo.width}
                    height={logo.height}
                    sizes="320px"
                    style={{ "--logo-scale": logo.scale } as CSSProperties}
                    className="mx-fib-lg h-[calc(2rem*var(--logo-scale))] w-auto max-w-none opacity-80 sm:mx-fib-xl sm:h-[calc(3rem*var(--logo-scale))]"
                  />
                ),
              }))}
            />
          </section>
        ) : topics.length > 0 ? (
          <Marquee
            label="Themen"
            items={topics.map((topic, i) => ({
              key: topic,
              content: (
                <span
                  className={cn(
                    "flex items-center gap-fib-lg pr-fib-lg text-4xl font-semibold tracking-tight whitespace-nowrap sm:text-6xl",
                    i % 2 ? "text-muted-foreground" : undefined,
                  )}
                >
                  {topic}
                  <span aria-hidden className="size-2 rounded-full bg-foreground sm:size-3" />
                </span>
              ),
            }))}
          />
        ) : null}

        {/* Manifesto: a pinned light screen; its phrases replace each other with the scroll. */}
        {manifesto.length > 0 ? (
          <Manifesto phrases={manifesto} caption={settings.manifesto?.caption} />
        ) : null}

        {/* About: the first paragraph of the „Über mich“ page, revealed with the scroll. */}
        {aboutText ? (
          <section aria-labelledby="ueber-titel" className="page-container py-section">
            <h2 id="ueber-titel" className="text-sm font-medium text-muted-foreground">
              Über mich
            </h2>
            <div className="mt-fib-lg">
              <ScrollStatement text={aboutText} />
            </div>
            <Link
              href={ABOUT_PATH as never}
              className="mt-fib-xl inline-block text-sm font-medium underline decoration-primary underline-offset-8 transition-colors duration-200 hover:text-primary"
            >
              Mehr über mich
            </Link>
          </section>
        ) : null}

        {facts.length > 0 ? (
          <section aria-label="In Zahlen" className="page-container pb-section">
            <FactCounters facts={facts} />
          </section>
        ) : null}

        {/* Services: sticky heading; a rule fills above each service as it passes (home-motion.tsx). */}
        {services.length > 0 ? (
          <section
            id="leistungen"
            aria-labelledby="leistungen-titel"
            className="page-container scroll-mt-fib-xl pb-section"
          >
            <div className="grid gap-fib-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.618fr)]">
              <h2
                id="leistungen-titel"
                className="text-5xl leading-none font-semibold tracking-tighter sm:text-7xl lg:sticky lg:top-[calc(var(--spacing-header)+var(--spacing-fib-lg))] lg:self-start"
              >
                Leistungen
              </h2>
              <ul>
                {services.map((service) => (
                  <li key={service.id ?? service.title} data-service className="relative py-fib-xl">
                    <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-border">
                      <div
                        data-service-line
                        className="h-full origin-left scale-x-0 bg-foreground motion-reduce:scale-x-100"
                      />
                    </div>
                    <h3 className="text-3xl font-medium tracking-tight text-balance sm:text-5xl">
                      {service.title}
                    </h3>
                    <p className="mt-fib-md max-w-prose text-lg text-pretty text-muted-foreground">
                      {service.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* Gallery: pinned horizontal travel on wide screens (home-motion.tsx), grid otherwise. */}
        <section
          id="projekte"
          data-gallery
          aria-labelledby="projekte-titel"
          className="overflow-x-clip pt-fib-xl lg:flex lg:h-dvh lg:flex-col lg:justify-center lg:pt-header"
        >
          <div className="page-container flex items-end justify-between gap-fib-md">
            <h2
              id="projekte-titel"
              className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              Ausgewählte Projekte
            </h2>
            {gallery.length > 0 ? (
              <p className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                {gallery.length} {gallery.length === 1 ? "Projekt" : "Projekte"}
              </p>
            ) : null}
          </div>
          <div aria-hidden className="page-container mt-fib-md hidden lg:block">
            <div className="h-px bg-border">
              <div data-progress className="h-px origin-left bg-foreground opacity-0" />
            </div>
          </div>

          {projects.length === 0 ? (
            <p className="page-container mt-fib-lg text-pretty text-muted-foreground">
              Noch keine Projekte veröffentlicht.
            </p>
          ) : (
            <div data-track-viewport className="mt-fib-lg lg:overflow-x-auto">
              <ul
                data-track
                className="page-container grid gap-x-grid gap-y-fib-xl sm:grid-cols-2 lg:flex lg:w-max lg:max-w-none lg:gap-x-fib-2xl lg:px-[max(var(--spacing-gutter),calc((100vw-var(--container-page))/2+var(--spacing-gutter)))]"
              >
                {gallery.map((project, index) => {
                  const cover = mediaUrl(project.cover, "card");
                  const alt = typeof project.cover === "object" ? project.cover.alt : "";
                  return (
                    <li
                      key={project.id}
                      data-panel
                      className="lg:w-[min(56vw,76rem,calc((100dvh-19rem)*1.618))] lg:shrink-0"
                    >
                      <Link
                        href={projectPath(project.slug) as never}
                        data-cursor="Ansehen"
                        className="group block rounded-lg outline-offset-4"
                      >
                        {cover ? (
                          <TiltCard className="relative aspect-golden overflow-hidden rounded-lg bg-muted">
                            <Image
                              data-panel-media
                              src={cover}
                              alt={alt}
                              width={960}
                              height={593}
                              sizes="(min-width: 64rem) 56vw, (min-width: 640px) 50vw, 100vw"
                              // First two covers are above the fold on phones and tablets (LCP).
                              loading={index < 2 ? "eager" : "lazy"}
                              className="size-full object-cover"
                            />
                          </TiltCard>
                        ) : null}
                        <div className="mt-fib-md flex items-baseline justify-between gap-4">
                          <h3 className="text-xl font-medium text-balance decoration-primary decoration-1 underline-offset-4 group-hover:underline sm:text-2xl">
                            {project.title}
                          </h3>
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {project.year}
                          </span>
                        </div>
                        <p className="mt-2 max-w-prose text-pretty text-muted-foreground">
                          {project.summary}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Index: every project as a row; with a mouse, the cover follows the pointer. */}
        {projects.length > 0 ? (
          <section aria-labelledby="index-titel" className="page-container mt-section">
            <div className="flex items-end justify-between gap-fib-md">
              <h2
                id="index-titel"
                className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
              >
                Alle Projekte
              </h2>
            </div>
            <div className="mt-fib-lg">
              <ProjectIndex
                items={projects.flatMap((p) => {
                  const href = projectPath(p.slug);
                  if (!href) return [];
                  const meta = [p.client, p.role].filter(Boolean).join(", ");
                  const cover = mediaUrl(p.cover, "thumbnail");
                  const tags = p.tags ?? [];
                  return [{ href, title: p.title, meta, year: p.year, cover, tags }];
                })}
                topics={topics}
              />
            </div>
          </section>
        ) : null}

        {/* Process: the steps stack up as sticky cards; covered cards step back (home-motion.tsx). */}
        {steps.length > 0 ? (
          <section aria-labelledby="ablauf-titel" className="page-container mt-section">
            <h2
              id="ablauf-titel"
              className="text-5xl leading-none font-semibold tracking-tighter sm:text-7xl"
            >
              Ablauf
            </h2>
            <ol className="mt-fib-xl">
              {steps.map((step, i) => (
                <li
                  key={step.id ?? step.title}
                  data-step
                  className="sticky pb-fib-md"
                  style={{
                    top: `calc(var(--spacing-header) + var(--spacing-fib-md) + ${i} * 1.5rem)`,
                  }}
                >
                  <div
                    data-step-card
                    className="grid min-h-[45dvh] origin-top content-between gap-fib-xl rounded-2xl bg-foreground p-fib-lg text-background shadow-2xl sm:p-fib-xl lg:grid-cols-golden lg:content-stretch"
                  >
                    <div className="flex flex-col justify-between gap-fib-lg">
                      <h3 className="text-3xl font-medium tracking-tight text-balance sm:text-5xl">
                        {step.title}
                      </h3>
                      <span
                        aria-hidden
                        className="hidden text-[clamp(5rem,12vw,10rem)] leading-none font-semibold tracking-tighter text-background/20 tabular-nums lg:block"
                      >
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex flex-col justify-between gap-fib-lg">
                      <p className="max-w-prose text-lg text-pretty text-background/75">
                        {step.description}
                      </p>
                      <p className="text-sm text-background/75 tabular-nums">
                        Schritt {i + 1} von {steps.length}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* FAQ: questions from the CMS as an accordion, also published as FAQPage structured data. */}
        {faq.length > 0 ? (
          <section aria-labelledby="fragen-titel" className="page-container mt-section">
            <JsonLd
              data={{
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faq.map((item) => ({
                  "@type": "Question",
                  name: item.question,
                  acceptedAnswer: { "@type": "Answer", text: item.answer },
                })),
              }}
            />
            <div className="grid gap-fib-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.618fr)]">
              <h2
                id="fragen-titel"
                className="text-5xl leading-none font-semibold tracking-tighter text-balance sm:text-7xl lg:sticky lg:top-[calc(var(--spacing-header)+var(--spacing-fib-lg))] lg:self-start"
              >
                Häufige Fragen
              </h2>
              <Accordion type="single" collapsible className="border-t">
                {faq.map((item) => (
                  <AccordionItem
                    key={item.id ?? item.question}
                    value={item.question}
                    className="border-b"
                  >
                    <AccordionTrigger className="py-fib-lg text-xl tracking-tight hover:no-underline **:data-[slot=accordion-trigger-icon]:mt-2 **:data-[slot=accordion-trigger-icon]:size-6 **:data-[slot=accordion-trigger-icon]:text-foreground sm:text-3xl">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="max-w-prose pb-fib-lg text-lg text-pretty text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        ) : null}

        {/* Configurator: three questions write the start of a message for the contact form. */}
        <section aria-labelledby="konfigurator-titel" className="page-container mt-section">
          <h2
            id="konfigurator-titel"
            className="text-5xl leading-none font-semibold tracking-tighter text-balance sm:text-7xl"
          >
            Ihr Projekt in drei Fragen
          </h2>
          <div className="mt-fib-xl">
            <ProjectConfigurator services={services.map((service) => service.title)} />
          </div>
        </section>

        {/* Closing: a dark panel that opens to full bleed as it scrolls in (home-motion.tsx). */}
        <section
          aria-labelledby="anfrage-titel"
          data-curtain
          className="mt-section bg-foreground py-fib-4xl text-background"
        >
          <div className="page-container">
            <h2
              id="anfrage-titel"
              className="max-w-6xl text-5xl leading-[0.95] font-semibold tracking-tighter text-balance sm:text-7xl lg:text-8xl 3xl:text-9xl"
            >
              Sie planen eine neue Website?
            </h2>
            <p className="mt-fib-md max-w-xl text-lg text-pretty text-background/75">
              Beschreiben Sie kurz Ihr Vorhaben. Ich melde mich bei Ihnen.
            </p>
            <div className="mt-fib-xl flex flex-wrap items-center gap-x-fib-xl gap-y-fib-md">
              <Magnetic>
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-full bg-background px-8 text-base text-foreground hover:bg-background/85 focus-visible:ring-background/50 active:scale-[0.97]"
                >
                  <Link href="/kontakt">Zum Kontaktformular</Link>
                </Button>
              </Magnetic>
              {settings.contactEmail ? (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="text-lg font-medium underline decoration-background/30 underline-offset-8 outline-background transition-[text-decoration-color] duration-200 hover:decoration-background"
                >
                  {settings.contactEmail}
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </HomeMotion>
  );
}
