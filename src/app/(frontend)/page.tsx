import type { Metadata } from "next";

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

      <section aria-labelledby="start-titel" data-cms-zone="kopf">
        <div className="page-container grid gap-8 py-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-10 lg:py-24">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <h1
              id="start-titel"
              className="font-hand text-4xl leading-none font-semibold text-balance break-words sm:text-6xl lg:text-7xl"
            >
              {hero.headline}
            </h1>
            {hero.lead ? (
              <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">{hero.lead}</p>
            ) : null}
          </div>

          {/* The invitation card: its reply slip names the price for the chosen town. Towns, price
              and the next free Saturday come from the booking engine (Phase 7). */}
          <form
            action="/buchen"
            method="get"
            className="rounded-3xl bg-secondary p-2 shadow-lg sm:-rotate-1 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
          >
            <div className="rounded-2xl border-2 border-dashed border-foreground/20 p-6">
              <p className="font-hand text-2xl font-semibold sm:text-3xl">
                Die Eisprinzessin kommt zu Ihnen
              </p>
              <p className="mt-2 text-base text-muted-foreground">
                Oder eine andere Figur. Sie wählen gleich im nächsten Schritt.
              </p>
              <div className="-mx-6 mt-5 border-t-2 border-dashed border-foreground/20 px-6 pt-5">
                <label htmlFor="start-ort" className="text-sm font-medium">
                  Wo feiern Sie?
                </label>
                <select
                  id="start-ort"
                  name="ort"
                  defaultValue="Aschaffenburg"
                  className="mt-2 w-full rounded-lg border border-input bg-card px-4 py-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring"
                >
                  <option>Aschaffenburg</option>
                  <option>Hanau</option>
                  <option>Offenbach</option>
                  <option>Frankfurt am Main</option>
                  <option>Würzburg</option>
                  <option>Mainz</option>
                  <option>Wiesbaden</option>
                </select>
                <p className="mt-5 text-4xl font-semibold tabular-nums">ab 149 €</p>
                <p className="mt-1 text-base text-muted-foreground">
                  Mini, 45 Minuten. Anfahrt inklusive.
                </p>
                <p className="mt-4 text-base">
                  Nächster freier Samstag:{" "}
                  <span className="rounded-md bg-highlight px-1.5 font-medium whitespace-nowrap text-highlight-foreground">
                    28. November
                  </span>
                </p>
                <button
                  type="submit"
                  className={buttonVariants({
                    size: "lg",
                    className: "mt-6 h-auto w-full rounded-full py-3.5 text-base font-semibold",
                  })}
                >
                  Jetzt buchen
                </button>
              </div>
            </div>
          </form>

          <ul className="flex flex-col gap-2 text-base lg:col-start-1 lg:row-start-2">
            <li>45 bis 120 Minuten, mit Spielen und kleiner Show</li>
            <li>Für Kinder von 3 bis 12 Jahren</li>
            <li>Auf Deutsch, Ukrainisch, Russisch oder Englisch</li>
          </ul>
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
