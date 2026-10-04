import type { Metadata } from "next";

import { preisText } from "@/buchung/logik/preis";
import { Reveal } from "@/components/motion/reveal";
import { Abriss, EinladungsKarte } from "@/components/site/einladungs-karte";
import { FigurBild } from "@/components/site/figur-bild";
import { Verweis } from "@/components/site/verweis";
import { buttonVariants } from "@/components/ui/button";
import { getKatalog, getPreise, getStaedte } from "@/data/katalog";
import { getSiteSettings } from "@/data/queries";
import { env } from "@/env";
import { anbieterJsonLd } from "@/lib/anbieter";
import { absoluteUrl, JsonLd } from "@/lib/seo";
import { SPRACH_ALTERNATIVEN } from "@/lib/sprachen";

import { TEXTE, type Fremdsprache } from "../_lib/texte";

// One landing page for parents who speak Ukrainian or Russian: what we do, the lowest price and
// the travel span, the Figuren who play in their language, how booking works, the way to write.
// Links lead into the German site with the language already chosen.

export function sprachMetadata(sprache: Fremdsprache): Metadata {
  const t = TEXTE[sprache];
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SERVER_URL),
    title: t.titel,
    description: t.beschreibung,
    alternates: { canonical: `/${sprache}`, languages: SPRACH_ALTERNATIVEN },
    openGraph: {
      title: t.titel,
      description: t.beschreibung,
      locale: t.ogLocale,
      type: "website",
      url: `/${sprache}`,
    },
  };
}

export async function SprachLanding({ sprache }: { sprache: Fremdsprache }) {
  const t = TEXTE[sprache];
  const [katalog, preise, staedte, settings] = await Promise.all([
    getKatalog(),
    getPreise(),
    getStaedte(),
    getSiteSettings(),
  ]);
  const figuren = katalog.filter((f) => f.buchbar && f.sprachen.includes(sprache));
  const guenstigstes = preise.pakete.find((p) => p.preisCent === preise.abCent);
  const aufschlaege = preise.zonen.filter((z) => !z.nurAnfrage).map((z) => z.aufschlagCent);
  const buchen = `/buchen?sprache=${sprache}`;

  return (
    <main>
      <JsonLd
        data={anbieterJsonLd({
          name: settings.siteName,
          url: absoluteUrl("/"),
          description: t.beschreibung,
          firma: null,
          staedte: staedte.filter((s) => !s.zone.nurAnfrage).map((s) => s.name),
          preise: null,
          sprachen: [sprache],
        })}
      />

      <section aria-labelledby="sprache-titel">
        <div className="page-container grid gap-8 py-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
          <div className="lg:self-center">
            <h1
              id="sprache-titel"
              className="font-hand text-4xl leading-tight font-semibold text-balance break-words sm:text-6xl"
            >
              {t.h1}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">{t.lead}</p>
          </div>
          <EinladungsKarte className="sm:-rotate-1 lg:self-center">
            <p className="font-hand text-2xl font-semibold sm:text-3xl">{t.karteTitel}</p>
            <Abriss>
              {preise.abCent !== null ? (
                <>
                  <p className="text-4xl font-semibold tabular-nums">
                    {t.ab(preisText(preise.abCent))}
                  </p>
                  <p className="mt-1 text-base text-pretty text-muted-foreground">
                    {guenstigstes?.dauerMin
                      ? `${t.paket(guenstigstes.name, guenstigstes.dauerMin)} `
                      : ""}
                    {aufschlaege.length > 0
                      ? t.anfahrt(
                          preisText(Math.min(...aufschlaege)),
                          preisText(Math.max(...aufschlaege)),
                        )
                      : null}
                  </p>
                </>
              ) : null}
              <Verweis
                href={buchen as never}
                className={buttonVariants({
                  size: "lg",
                  className: "mt-6 h-auto w-full rounded-full py-3.5 text-base font-semibold",
                })}
              >
                {t.buchen}
              </Verweis>
              <p className="mt-3 text-sm text-pretty text-muted-foreground">{t.formHinweis}</p>
            </Abriss>
          </EinladungsKarte>
        </div>
      </section>

      {figuren.length > 0 ? (
        <section aria-labelledby="sprache-figuren" className="border-t">
          <div className="page-container py-16 sm:py-20">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2
                id="sprache-figuren"
                className="font-hand text-3xl font-semibold text-balance sm:text-4xl"
              >
                {t.figurenTitel}
              </h2>
              <Verweis
                href={`/figuren?sprache=${sprache}` as never}
                className="inline-flex min-h-11 items-center text-base underline underline-offset-4"
              >
                {t.alleFiguren}
              </Verweis>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {figuren.map((f, i) => (
                <Reveal as="li" key={f.id} order={i % 4} className="group relative">
                  <FigurBild
                    foto={f.foto}
                    name={f.name}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="aspect-4/5 group-has-focus-visible:ring-3 group-has-focus-visible:ring-ring"
                  />
                  <h3 className="mt-3 font-hand text-xl leading-tight font-semibold">
                    <Verweis
                      href={`/figuren/${f.slug}` as never}
                      lang="de"
                      className="outline-none after:absolute after:inset-0 after:rounded-3xl"
                    >
                      {f.name}
                    </Verweis>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.jahre(f.alterVon, f.alterBis)}
                  </p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="sprache-schritte" className="border-t">
        <div className="page-container py-16 sm:py-20">
          <h2
            id="sprache-schritte"
            className="font-hand text-3xl font-semibold text-balance sm:text-4xl"
          >
            {t.schritteTitel}
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {t.schritte.map((schritt, i) => (
              <Reveal
                as="li"
                key={schritt}
                order={i}
                className="border-t-2 border-dashed border-foreground/20 pt-5"
              >
                <p
                  aria-hidden
                  className="font-hand text-5xl leading-none font-semibold text-primary"
                >
                  {i + 1}
                </p>
                <p className="mt-3 text-lg text-pretty">{schritt}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="sprache-fragen" className="border-t">
        <div className="page-container py-16 sm:py-20">
          <h2
            id="sprache-fragen"
            className="font-hand text-3xl font-semibold text-balance sm:text-4xl"
          >
            {t.fragenTitel}
          </h2>
          <p className="mt-3 max-w-xl text-lg text-pretty text-muted-foreground">{t.fragenText}</p>
          <Verweis
            href={"/kontakt" as never}
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "mt-6 h-auto rounded-full px-8 py-3 text-base",
            })}
          >
            {t.schreiben}
          </Verweis>
        </div>
      </section>
    </main>
  );
}
