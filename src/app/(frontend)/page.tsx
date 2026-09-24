import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getHomePage, getSiteSettings } from "@/data/queries";
import { absoluteUrl, JsonLd, mediaUrl } from "@/lib/seo";

import { MountainHero } from "./_components/mountain-scene";

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

const SERVICES = [
  {
    title: "Web-Anwendungen",
    text: "Portale, Kundenbereiche und interne Werkzeuge, die im Browser laufen – ohne Installation, auf jedem Gerät.",
  },
  {
    title: "Mobile Apps",
    text: "Apps für iOS und Android, wenn Ihre Mitarbeitenden oder Kunden unterwegs arbeiten.",
  },
  {
    title: "Schnittstellen und Integration",
    text: "Wir verbinden ERP, CRM, Shop und Fachsysteme, damit Daten nicht mehr von Hand übertragen werden.",
  },
  {
    title: "Modernisierung",
    text: "Gewachsene Altsysteme überführen wir schrittweise in eine wartbare Architektur, während der Betrieb weiterläuft.",
  },
  {
    title: "Betrieb und Weiterentwicklung",
    text: "Nach dem Start bleiben wir ansprechbar: Updates, Überwachung und neue Funktionen.",
  },
];

const STEPS = [
  {
    title: "Verstehen",
    text: "In einem Workshop klären wir Ziele, Nutzer und Randbedingungen. Danach erhalten Sie eine schriftliche Einschätzung zu Umfang und Vorgehen.",
  },
  {
    title: "Entwerfen",
    text: "Ein klickbarer Prototyp zeigt früh, wie sich die Anwendung anfühlt – bevor viel Code entsteht.",
  },
  {
    title: "Entwickeln",
    text: "Wir bauen in kurzen Iterationen und zeigen Ihnen regelmäßig lauffähige Zwischenstände.",
  },
  {
    title: "Betreiben",
    text: "Wir bringen die Software in Betrieb und entwickeln sie mit Ihnen weiter.",
  },
];

const PRINCIPLES = [
  {
    title: "Ihr Code gehört Ihnen",
    text: "Quellcode und Dokumentation übergeben wir vollständig. Sie bleiben unabhängig von uns.",
  },
  {
    title: "Feste Ansprechpartner",
    text: "Sie sprechen mit den Menschen, die Ihre Software entwickeln – vom ersten Gespräch bis zum Betrieb.",
  },
  {
    title: "Daten in Europa",
    text: "Auf Wunsch betreiben wir Ihre Anwendung auf Servern in Deutschland, ohne Dienste von US-Anbietern.",
  },
];

export default async function HomePage() {
  const settings = await getSiteSettings();

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
        <div className="page-container pt-16 pb-20 sm:pt-24">
          <h1
            id="start-titel"
            className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
          >
            Individuelle Software, die Ihre Abläufe trägt.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
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
      </MountainHero>

      <section id="leistungen" aria-labelledby="leistungen-titel" className="border-t">
        <div className="page-container grid gap-10 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--spacing-header)+3rem)] lg:self-start">
            <h2
              id="leistungen-titel"
              className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              Was wir entwickeln
            </h2>
            <p className="mt-4 max-w-sm text-pretty text-muted-foreground">
              Von der einzelnen Schnittstelle bis zur kompletten Plattform – geplant für Ihre
              Abläufe, nicht für einen Standardfall.
            </p>
          </div>
          <ul className="divide-y border-y">
            {SERVICES.map((service) => (
              <li
                key={service.title}
                className="grid gap-2 py-7 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8"
              >
                <h3 className="text-xl font-medium tracking-tight">{service.title}</h3>
                <p className="text-pretty text-muted-foreground">{service.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="vorgehen" aria-labelledby="vorgehen-titel" className="border-t bg-card">
        <div className="page-container py-20 sm:py-28">
          <h2
            id="vorgehen-titel"
            className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            So arbeiten wir
          </h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t border-primary/60 pt-6">
                <span className="text-sm font-medium text-primary tabular-nums">
                  Schritt {index + 1}
                </span>
                <h3 className="mt-2 text-xl font-medium tracking-tight">{step.title}</h3>
                <p className="mt-3 text-pretty text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="grundsaetze-titel" className="border-t">
        <div className="page-container py-20 sm:py-28">
          <h2
            id="grundsaetze-titel"
            className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            Unsere Grundsätze
          </h2>
          <dl className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
            {PRINCIPLES.map((principle) => (
              <div key={principle.title}>
                <dt className="text-xl font-medium tracking-tight">{principle.title}</dt>
                <dd className="mt-3 text-pretty text-muted-foreground">{principle.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="anfrage-titel" className="border-t">
        <div className="page-container flex flex-col items-start gap-8 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2
              id="anfrage-titel"
              className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl"
            >
              Erzählen Sie uns von Ihrem Vorhaben.
            </h2>
            <p className="mt-4 text-lg text-pretty text-muted-foreground">
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
