// Who offers the parties, as structured data for search engines. Accurate or nothing: a
// LocalBusiness (EntertainmentBusiness) only once the owner's address is entered under
// /admin/firma, since Google requires one; until then an Organization with the towns it serves.
// Pure: the pages pass in what they read.

export type AnbieterDaten = {
  name: string;
  url: string;
  description: string | null;
  firma: {
    strasse: string | null;
    plz: string | null;
    ort: string | null;
    telefon: string | null;
  } | null;
  staedte: string[];
  /** Lowest and highest package price in cents, for priceRange. */
  preise: { vonCent: number; bisCent: number } | null;
  sprachen: string[];
};

const euro = (cent: number) => `${Math.round(cent / 100)} €`;

export function anbieterJsonLd(a: AnbieterDaten): Record<string, unknown> {
  const adresse =
    a.firma?.strasse && a.firma.plz && a.firma.ort
      ? {
          "@type": "PostalAddress",
          streetAddress: a.firma.strasse,
          postalCode: a.firma.plz,
          addressLocality: a.firma.ort,
          addressCountry: "DE",
        }
      : null;
  return {
    "@context": "https://schema.org",
    "@type": adresse ? "EntertainmentBusiness" : "Organization",
    "@id": `${a.url}#anbieter`,
    name: a.name,
    url: a.url,
    ...(a.description ? { description: a.description } : {}),
    ...(adresse ? { address: adresse } : {}),
    ...(adresse && a.firma?.telefon ? { telephone: a.firma.telefon } : {}),
    ...(adresse && a.preise
      ? { priceRange: `${euro(a.preise.vonCent)}–${euro(a.preise.bisCent)}` }
      : {}),
    ...(a.staedte.length > 0
      ? { areaServed: a.staedte.map((name) => ({ "@type": "City", name })) }
      : {}),
    ...(a.sprachen.length > 0 ? { knowsLanguage: a.sprachen } : {}),
  };
}
