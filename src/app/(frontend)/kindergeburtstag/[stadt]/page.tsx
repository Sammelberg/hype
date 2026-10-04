import type { Metadata } from "next";

import { preisText } from "@/buchung/logik/preis";
import { terminText } from "@/buchung/logik/zeit";
import { Reveal } from "@/components/motion/reveal";
import { Abriss, EinladungsKarte } from "@/components/site/einladungs-karte";
import { FigurenGalerie } from "@/components/site/figuren-galerie";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { Verweis } from "@/components/site/verweis";
import { buttonVariants } from "@/components/ui/button";
import { getFreieSamstage, getKatalog, getPreise, getStadtSeite, getStaedte } from "@/data/katalog";
import { getSiteSettings } from "@/data/queries";
import { redirectOrNotFound } from "@/data/redirect-or-not-found";
import { absoluteUrl, buildMetadata, JsonLd } from "@/lib/seo";

// A town's landing page (/admin → Buchung → Orte, „Eigene Seite“): only towns with a text of
// their own get one. The price there includes the town's travel, the next free Saturday comes
// from the booking engine. Static, refreshed every five minutes.

export const revalidate = 300;

type Props = { params: Promise<{ stadt: string }> };

export async function generateStaticParams() {
  const staedte = await getStaedte();
  return staedte.filter((s) => s.seite).map((s) => ({ stadt: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stadt: slug } = await params;
  const stadt = await getStadtSeite(slug);
  if (!stadt) return {};
  return buildMetadata({
    meta: { title: stadt.metaTitle, description: stadt.metaDescription },
    fallbackTitle: `Kindergeburtstag in ${stadt.name} mit Figur`,
    fallbackDescription: stadt.intro,
    path: `/kindergeburtstag/${stadt.slug}`,
  });
}

const H2 = "font-hand text-2xl font-semibold text-balance sm:text-3xl";

export default async function StadtSeite({ params }: Props) {
  const { stadt: slug } = await params;
  const [stadt, preise, katalog, samstage, settings] = await Promise.all([
    getStadtSeite(slug),
    getPreise(),
    getKatalog(),
    getFreieSamstage(),
    getSiteSettings(),
  ]);
  if (!stadt) return redirectOrNotFound(`/kindergeburtstag/${slug}`);

  const path = `/kindergeburtstag/${stadt.slug}`;
  const preisCent =
    stadt.zone.nurAnfrage || preise.abCent === null
      ? null
      : preise.abCent + stadt.zone.aufschlagCent;
  const samstag = samstage.get(stadt.id);
  const termin = samstag ? terminText(samstag) : null;
  const guenstigstes = preise.pakete.find((p) => p.preisCent === preise.abCent);

  const abschnitte = [
    { titel: "Wohin wir kommen", text: stadt.bezirke },
    { titel: "Wo gefeiert wird", text: stadt.orte },
    { titel: "Was wir brauchen", text: stadt.bedingungen },
  ].filter((a): a is { titel: string; text: string } => Boolean(a.text));

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: `Kindergeburtstag in ${stadt.name}`,
          serviceType: "Kinderanimation",
          url: absoluteUrl(path),
          ...(stadt.intro ? { description: stadt.intro } : {}),
          provider: { "@type": "Organization", name: settings.siteName, url: absoluteUrl("/") },
          areaServed: { "@type": "City", name: stadt.name },
          ...(preisCent !== null
            ? {
                offers: {
                  "@type": "Offer",
                  priceCurrency: "EUR",
                  price: (preisCent / 100).toFixed(2),
                  url: absoluteUrl(path),
                },
              }
            : {}),
        }}
      />

      <div className="page-container grid gap-8 pt-8 pb-16 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-x-16 lg:pb-24">
        <PageBreadcrumbs
          className="lg:col-span-2"
          trail={[
            { name: "Startseite", path: "/" },
            { name: `Kindergeburtstag in ${stadt.name}`, path },
          ]}
        />
        <div className="lg:self-center">
          <h1 className="font-hand text-4xl leading-none font-semibold text-balance break-words sm:text-6xl">
            Kindergeburtstag in {stadt.name}
          </h1>
          {stadt.intro ? (
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">{stadt.intro}</p>
          ) : null}
        </div>

        <EinladungsKarte className="sm:-rotate-1 lg:self-center">
          <p className="font-hand text-2xl font-semibold sm:text-3xl">
            Eine Figur kommt nach {stadt.name}
          </p>
          <Abriss>
            {preisCent !== null ? (
              <>
                <p className="text-4xl font-semibold tabular-nums">ab {preisText(preisCent)}</p>
                <p className="mt-1 text-base text-muted-foreground">
                  {guenstigstes ? `${guenstigstes.name}, ${guenstigstes.dauerMin} Minuten. ` : ""}
                  Anfahrt nach {stadt.name} inklusive.
                </p>
                <p className="mt-4 text-base">
                  {termin ? (
                    <>
                      Nächster freier Samstag:{" "}
                      <span className="rounded-md bg-highlight px-1.5 font-medium whitespace-nowrap text-highlight-foreground">
                        {termin.tag}, {termin.uhrzeit} Uhr
                      </span>
                    </>
                  ) : (
                    "Samstags ist bis auf Weiteres alles vergeben; unter der Woche ist noch Platz."
                  )}
                </p>
                <Verweis
                  href={`/buchen?ort=${stadt.slug}` as never}
                  className={buttonVariants({
                    size: "lg",
                    className: "mt-6 h-auto w-full rounded-full py-3.5 text-base font-semibold",
                  })}
                >
                  Termin in {stadt.name} buchen
                </Verweis>
              </>
            ) : (
              <>
                <p className="text-lg text-pretty">
                  Nach {stadt.name} kommen wir auf Anfrage. Sie nennen den Wunschtermin, wir melden
                  uns mit einem Angebot.
                </p>
                <Verweis
                  href="/kontakt"
                  className={buttonVariants({
                    size: "lg",
                    className: "mt-6 h-auto w-full rounded-full py-3.5 text-base font-semibold",
                  })}
                >
                  Anfrage senden
                </Verweis>
              </>
            )}
          </Abriss>
        </EinladungsKarte>
      </div>

      {abschnitte.length > 0 ? (
        <div className="border-t">
          <div className="page-container grid gap-10 py-16 sm:py-20 lg:grid-cols-3 lg:gap-12">
            {abschnitte.map((a, i) => (
              <Reveal as="section" key={a.titel} order={i}>
                <h2 className={H2}>{a.titel}</h2>
                <p className="mt-3 text-base text-pretty">{a.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      ) : null}

      <FigurenGalerie
        titel={`Wer nach ${stadt.name} kommt`}
        text="Jede Figur kommt im Kostüm und bringt ihr eigenes Programm mit."
        figuren={katalog}
      />

      {stadt.bewertungen.length > 0 ? (
        <section aria-labelledby="stimmen-titel">
          <div className="page-container py-16 sm:py-20">
            <h2 id="stimmen-titel" className={H2}>
              Was Eltern aus {stadt.name} sagen
            </h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stadt.bewertungen.map((b, i) => (
                <Reveal as="li" key={b.id} order={i} className="rounded-3xl bg-secondary p-6">
                  <figure>
                    <blockquote className="text-base text-pretty">{b.text}</blockquote>
                    <figcaption className="mt-4 text-sm font-medium">{b.name}</figcaption>
                  </figure>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
