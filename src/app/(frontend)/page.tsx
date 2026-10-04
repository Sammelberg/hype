import type { Metadata } from "next";

import { preisText } from "@/buchung/logik/preis";
import { SPRACH_NAMEN, SPRACHEN } from "@/buchung/logik/typen";
import { terminText } from "@/buchung/logik/zeit";
import { Reveal } from "@/components/motion/reveal";
import { ClosingCta } from "@/components/site/closing-cta";
import { Faq } from "@/components/site/faq";
import { FigurenGalerie } from "@/components/site/figuren-galerie";
import { getFreieSamstage, getKatalog, getPreise, getStaedte } from "@/data/katalog";
import { getHomeContent, getSiteSettings } from "@/data/queries";
import { absoluteUrl, JsonLd, mediaUrl } from "@/lib/seo";

import { Einladung, type EinladungsOrt } from "./_components/einladung";

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

const H2 = "max-w-2xl font-hand text-3xl font-semibold text-balance sm:text-5xl";

// Prices and free Saturdays change with every booking: the page is rebuilt every five minutes.
export const revalidate = 300;

const satz = (woerter: string[]) =>
  woerter.length > 1 ? `${woerter.slice(0, -1).join(", ")} oder ${woerter.at(-1)}` : woerter[0];

export default async function HomePage() {
  const [settings, { sections }, staedte, preise, katalog, samstage] = await Promise.all([
    getSiteSettings(),
    getHomeContent(),
    getStaedte(),
    getPreise(),
    getKatalog(),
    getFreieSamstage(),
  ]);
  const { hero, steps, principles, faq } = sections;

  const orte: EinladungsOrt[] = staedte.map((s) => {
    const samstag = samstage.get(s.id);
    return {
      slug: s.slug,
      name: s.name,
      preis:
        s.zone.nurAnfrage || preise.abCent === null
          ? null
          : `ab ${preisText(preise.abCent + s.zone.aufschlagCent)}`,
      samstag: samstag ? terminText(samstag).tag : null,
    };
  });
  const start = staedte.find((s) => s.seite)?.slug ?? staedte[0]?.slug ?? "";
  const guenstigstes = preise.pakete.find((p) => p.preisCent === preise.abCent);
  const paketText = guenstigstes ? `${guenstigstes.name}, ${guenstigstes.dauerMin} Minuten` : null;

  // What every visit promises, from the catalogue itself rather than a text that can go stale.
  const dauern = preise.pakete.flatMap((p) => (p.dauerMin && !p.nurAnfrage ? [p.dauerMin] : []));
  const sprachen = SPRACHEN.filter((sp) => katalog.some((f) => f.sprachen.includes(sp)));
  const fakten = [
    dauern.length > 0
      ? `${Math.min(...dauern)} bis ${Math.max(...dauern)} Minuten, mit Spielen und kleiner Show`
      : null,
    katalog.length > 0
      ? `Für Kinder von ${Math.min(...katalog.map((f) => f.alterVon))} bis ${Math.max(...katalog.map((f) => f.alterBis))} Jahren`
      : null,
    sprachen.length > 0 ? `Auf ${satz(sprachen.map((sp) => SPRACH_NAMEN[sp]))}` : null,
  ].filter((f): f is string => f !== null);

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

          {/* The invitation card: its reply slip names the price and the next free Saturday for
              the chosen town (booking engine). */}
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <Einladung orte={orte} start={start} paket={paketText} />
          </div>

          <ul className="flex flex-col gap-2 text-base lg:col-start-1 lg:row-start-2">
            {fakten.map((fakt) => (
              <li key={fakt}>{fakt}</li>
            ))}
          </ul>
        </div>
      </section>

      <FigurenGalerie
        titel="Wer kommt zur Feier?"
        text="Prinzessin, Pirat oder Dino-Forscherin: Jede Figur kommt im Kostüm und bringt ihr eigenes Programm mit."
        figuren={katalog}
      />

      {steps.length > 0 ? (
        <section aria-labelledby="vorgehen-titel" className="border-b" data-cms-zone="vorgehen">
          <div className="page-container py-16 sm:py-24">
            <h2 id="vorgehen-titel" className={H2}>
              {sections.stepsTitle}
            </h2>
            {/* A real sequence, so it is numbered; the dashed line is the way from choosing to
                the party. */}
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {steps.map((step, i) => (
                <Reveal
                  as="li"
                  key={step.id}
                  order={i}
                  className="border-t-2 border-dashed border-foreground/20 pt-5"
                >
                  <p
                    aria-hidden
                    className="font-hand text-5xl leading-none font-semibold text-primary"
                  >
                    {i + 1}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-pretty text-muted-foreground">{step.text}</p>
                </Reveal>
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
            <dl className="mt-10 grid gap-4 sm:grid-cols-2">
              {principles.map((principle, i) => (
                <Reveal key={principle.id} order={i % 2} className="rounded-3xl bg-secondary p-6">
                  <dt className="font-hand text-2xl font-semibold text-balance">
                    {principle.title}
                  </dt>
                  <dd className="mt-2 text-base text-pretty">{principle.text}</dd>
                </Reveal>
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
