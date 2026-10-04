import type { Metadata } from "next";

import { preisText } from "@/buchung/logik/preis";
import { KATEGORIE_NAMEN } from "@/buchung/logik/typen";
import { Reveal } from "@/components/motion/reveal";
import { Worte } from "@/components/motion/worte";
import { buttonVariants } from "@/components/ui/button";
import { EinladungsKarte } from "@/components/site/einladungs-karte";
import { FigurBild } from "@/components/site/figur-bild";
import { altersText, FigurKarte, sprachenText } from "@/components/site/figur-karte";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { Verweis } from "@/components/site/verweis";
import { getFigur, getKatalog, getPreise, getStaedte } from "@/data/katalog";
import { getSiteSettings } from "@/data/queries";
import { redirectOrNotFound } from "@/data/redirect-or-not-found";
import { absoluteUrl, buildMetadata, JsonLd, mediaUrl } from "@/lib/seo";

// One Figur (/admin → Buchung → Figuren): pictures, what happens at the party, ages, languages,
// the lowest price and the way to book it. Static, refreshed every five minutes.

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const figuren = await getKatalog();
  return figuren.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const figur = await getFigur(slug);
  if (!figur) return {};
  const bild = mediaUrl(figur.fotos[0], "hero");
  const metadata = buildMetadata({
    meta: { title: figur.metaTitle, description: figur.metaDescription },
    fallbackTitle: `${figur.name} für den Kindergeburtstag`,
    fallbackDescription: figur.kurz ?? figur.beschreibung,
    path: `/figuren/${figur.slug}`,
  });
  return bild
    ? { ...metadata, openGraph: { ...metadata.openGraph, images: [{ url: bild }] } }
    : metadata;
}

export default async function FigurSeite({ params }: Props) {
  const { slug } = await params;
  const [figur, preise, staedte, alle, settings] = await Promise.all([
    getFigur(slug),
    getPreise(),
    getStaedte(),
    getKatalog(),
    getSiteSettings(),
  ]);
  if (!figur) return redirectOrNotFound(`/figuren/${slug}`);

  const path = `/figuren/${figur.slug}`;
  const guenstigstes = preise.pakete.find((p) => p.preisCent === preise.abCent);
  const aufschlaege = preise.zonen.filter((z) => !z.nurAnfrage).map((z) => z.aufschlagCent);
  const weitere = [...alle.filter((f) => f.id !== figur.id)]
    .sort(
      (a, b) => Number(b.kategorie === figur.kategorie) - Number(a.kategorie === figur.kategorie),
    )
    .slice(0, 4);

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: `${figur.name} für den Kindergeburtstag`,
          serviceType: "Kinderanimation",
          url: absoluteUrl(path),
          ...(figur.kurz ? { description: figur.kurz } : {}),
          ...(figur.fotos[0] ? { image: absoluteUrl(figur.fotos[0].url) } : {}),
          provider: { "@type": "Organization", name: settings.siteName, url: absoluteUrl("/") },
          areaServed: staedte
            .filter((s) => !s.zone.nurAnfrage)
            .map((s) => ({ "@type": "City", name: s.name })),
          ...(preise.abCent !== null
            ? {
                offers: {
                  "@type": "Offer",
                  priceCurrency: "EUR",
                  price: (preise.abCent / 100).toFixed(2),
                  url: absoluteUrl(path),
                },
              }
            : {}),
        }}
      />

      <div className="page-container grid gap-8 pt-8 pb-16 sm:pt-12 lg:grid-cols-2 lg:gap-16 lg:pb-24">
        <PageBreadcrumbs
          className="lg:col-span-2"
          trail={[
            { name: "Startseite", path: "/" },
            { name: "Figuren", path: "/figuren" },
            { name: figur.name, path },
          ]}
        />

        <div className="lg:col-start-2 lg:row-start-2">
          <p className="font-medium text-muted-foreground">{KATEGORIE_NAMEN[figur.kategorie]}</p>
          <h1 className="mt-2 font-hand text-4xl leading-tight font-semibold text-balance break-words sm:text-6xl">
            {figur.name}
          </h1>
          {figur.kurz ? (
            <p className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground">{figur.kurz}</p>
          ) : null}
        </div>

        {/* Pictures: one row that swipes on a phone, a column beside the text on a wide screen. */}
        <div className="-mx-gutter flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto px-gutter lg:sticky lg:top-24 lg:col-start-1 lg:row-span-3 lg:row-start-2 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-2 lg:self-start lg:overflow-visible lg:px-0">
          {(figur.fotos.length > 0 ? figur.fotos : [null]).map((foto, i) => (
            <FigurBild
              key={foto?.id ?? "platzhalter"}
              foto={foto}
              name={figur.name}
              preload={i === 0}
              sizes={i === 0 ? "(min-width: 1024px) 45vw, 85vw" : "(min-width: 1024px) 22vw, 85vw"}
              className={
                figur.fotos.length > 1
                  ? "aspect-4/5 w-[85%] shrink-0 snap-start lg:w-auto first:lg:col-span-2"
                  : "aspect-4/3 w-full sm:aspect-4/5 lg:col-span-2"
              }
            />
          ))}
        </div>

        <div className="lg:col-start-2 lg:row-start-3">
          {/* The invitation card: what it costs and the way to book it. */}
          <EinladungsKarte>
            {preise.abCent !== null ? (
              <>
                <p className="text-4xl font-semibold tabular-nums">ab {preisText(preise.abCent)}</p>
                <p className="mt-1 text-base text-pretty text-muted-foreground">
                  {guenstigstes ? `${guenstigstes.name}, ${guenstigstes.dauerMin} Minuten. ` : ""}
                  {aufschlaege.length > 0
                    ? `Anfahrt je nach Ort ${preisText(Math.min(...aufschlaege))} bis ${preisText(Math.max(...aufschlaege))}.`
                    : null}
                </p>
              </>
            ) : null}
            {figur.buchbar ? (
              <Verweis
                href={`/buchen?figur=${figur.slug}` as never}
                className={buttonVariants({
                  size: "lg",
                  className: "mt-6 h-auto w-full rounded-full py-3.5 text-base font-semibold",
                })}
              >
                {figur.name} buchen
              </Verweis>
            ) : (
              <>
                <p className="mt-4 text-base">Diese Figur buchen Sie zurzeit auf Anfrage.</p>
                <Verweis
                  href="/kontakt"
                  className={buttonVariants({
                    size: "lg",
                    className: "mt-4 h-auto w-full rounded-full py-3.5 text-base font-semibold",
                  })}
                >
                  Anfrage senden
                </Verweis>
              </>
            )}
            <Verweis
              href={"/preise" as never}
              className="mt-4 inline-flex min-h-11 items-center text-base underline underline-offset-4"
            >
              Alle Pakete und Preise
            </Verweis>
          </EinladungsKarte>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 text-base">
            <div>
              <dt className="text-sm text-muted-foreground">Alter</dt>
              <dd className="mt-0.5 font-medium">{altersText(figur)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Sprachen</dt>
              <dd className="mt-0.5 font-medium">{sprachenText(figur)}</dd>
            </div>
          </dl>

          {figur.programm.length > 0 ? (
            <section className="mt-12">
              <Reveal>
                <Worte
                  as="h2"
                  text="So läuft die Feier"
                  className="font-hand text-3xl font-semibold text-balance"
                />
              </Reveal>
              <ol className="mt-6 grid gap-3">
                {figur.programm.map((punkt, i) => (
                  <Reveal
                    as="li"
                    key={punkt}
                    order={i}
                    className="flex items-baseline gap-4 rounded-2xl border bg-card p-4 text-base"
                  >
                    <span className="font-hand text-2xl font-semibold text-primary tabular-nums">
                      {i + 1}
                    </span>
                    <span>{punkt}</span>
                  </Reveal>
                ))}
              </ol>
            </section>
          ) : null}

          {figur.beschreibung ? (
            <div className="mt-10 grid max-w-prose gap-4 text-base text-pretty">
              {figur.beschreibung.split(/\n{2,}/).map((absatz) => (
                <p key={absatz}>{absatz}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {weitere.length > 0 ? (
        <section aria-labelledby="weitere-titel" className="border-t">
          <div className="page-container py-16 sm:py-24">
            <h2
              id="weitere-titel"
              className="font-hand text-3xl font-semibold text-balance sm:text-4xl"
            >
              Auch gern gebucht
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {weitere.map((f, i) => (
                <Reveal as="li" key={f.id} order={i}>
                  <FigurKarte figur={f} sizes="(min-width: 1024px) 25vw, 50vw" />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
