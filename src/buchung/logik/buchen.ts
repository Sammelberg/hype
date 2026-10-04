// The website's booking form, the parts that are decisions rather than screens: what the form
// starts with from the link, when a second Figur is needed, the price line by line, and how an
// Anfrage is explained. Pure, client-safe: the form and the server action use the same functions.
import { preisAngebot, type PreisAngebot } from "./preis";
import type { AnfrageGrund } from "./regeln";
import { SPRACHEN, type Sprache } from "./typen";

export type BuchungsFigur = {
  id: number;
  slug: string;
  name: string;
  kurz: string | null;
  sprachen: Sprache[];
  alterVon: number;
  alterBis: number;
  buchbar: boolean;
  foto: { url: string; alt: string; focalX: number; focalY: number } | null;
};
export type BuchungsPaket = {
  id: number;
  slug: string;
  name: string;
  beschreibung: string | null;
  dauerMin: number | null;
  preisCent: number | null;
  figurenAnzahl: number;
  nurAnfrage: boolean;
};
export type BuchungsExtra = {
  id: number;
  name: string;
  beschreibung: string | null;
  preisCent: number | null;
  dauerDeltaMin: number;
  vorlaufTage: number;
  zusatzFigur: boolean;
  nurAnfrage: boolean;
};
export type BuchungsStadt = {
  id: number;
  slug: string;
  name: string;
  zone: { code: string; name: string; aufschlagCent: number; nurAnfrage: boolean };
};

/** Everything the form needs, read once on the server. */
export type BuchungsDaten = {
  figuren: BuchungsFigur[];
  pakete: BuchungsPaket[];
  extras: BuchungsExtra[];
  staedte: BuchungsStadt[];
  regeln: {
    anzahlungProzent: number;
    kleinunternehmer: boolean;
    mindestVorlaufStd: number;
    /** The day's offered starts, in minutes after midnight German time, for a wished time. */
    ersterStartMin: number;
    letzterStartMin: number;
    rasterMin: number;
  };
  /** Whether the Anzahlung can be paid online now (Mollie, or the test adapter). */
  zahlungOnline: boolean;
};

export type Vorauswahl = {
  figurId: number | null;
  paketId: number | null;
  stadtId: number | null;
  /** The language the Figur should play in (from the Ukrainian and Russian landing pages). */
  sprache: Sprache | null;
};

const einer = (wert: string | string[] | undefined) =>
  typeof wert === "string" ? wert : undefined;

/** What the link brings along (?figur=, ?paket=, ?ort= as slugs); unknown values are dropped. */
export function vorauswahl(
  params: Record<string, string | string[] | undefined>,
  d: Pick<BuchungsDaten, "figuren" | "pakete" | "staedte">,
): Vorauswahl {
  const figur = d.figuren.find((f) => f.slug === einer(params.figur) && f.buchbar);
  const paket = d.pakete.find((p) => p.slug === einer(params.paket));
  const stadt = d.staedte.find((s) => s.slug === einer(params.ort));
  const sprache = (SPRACHEN as readonly string[]).includes(einer(params.sprache) ?? "")
    ? (einer(params.sprache) as Sprache)
    : null;
  return {
    figurId: figur?.id ?? null,
    paketId: paket?.id ?? null,
    stadtId: stadt?.id ?? null,
    sprache,
  };
}

/** A second Figur comes with a two-Figur Paket or the Extra „second Figur“. */
export const zweiFigurenNoetig = (
  paket: Pick<BuchungsPaket, "figurenAnzahl"> | null,
  extras: Pick<BuchungsExtra, "zusatzFigur">[],
) => (paket?.figurenAnzahl ?? 1) === 2 || extras.some((x) => x.zusatzFigur);

/** The price as the form shows it; null until Paket and Stadt are chosen and both have prices. */
export function angebotFuer(
  d: Pick<BuchungsDaten, "regeln">,
  a: { paket: BuchungsPaket | null; stadt: BuchungsStadt | null; extras: BuchungsExtra[] },
): PreisAngebot | null {
  if (!a.paket || a.paket.preisCent === null || a.paket.nurAnfrage) return null;
  if (!a.stadt || a.stadt.zone.nurAnfrage) return null;
  if (a.extras.some((x) => x.preisCent === null || x.nurAnfrage)) return null;
  return preisAngebot({
    paket: { name: a.paket.name, preisCent: a.paket.preisCent },
    zone: { name: `nach ${a.stadt.name}`, aufschlagCent: a.stadt.zone.aufschlagCent },
    extras: a.extras.map((x) => ({ name: x.name, preisCent: x.preisCent! })),
    anzahlungProzent: d.regeln.anzahlungProzent,
    kleinunternehmer: d.regeln.kleinunternehmer,
  });
}

/** Why the form sends an Anfrage instead of a booking, in the customer's words. */
export const ANFRAGE_TEXT: Record<AnfrageGrund, string> = {
  kurzfristig:
    "So kurzfristig planen wir jede Feier von Hand. Senden Sie uns Ihre Anfrage, wir melden uns noch heute.",
  zone: "So weit fahren wir auf Anfrage. Senden Sie uns Ihren Wunschtermin, wir melden uns mit einem Angebot.",
  ausserhalb:
    "Dieser Ort liegt außerhalb unserer Zonen. Senden Sie uns Ihren Wunschtermin, wir melden uns.",
  paket:
    "Dieses Paket stellen wir für Sie zusammen. Senden Sie uns Ihre Anfrage, wir melden uns mit einem Angebot.",
  extra:
    "Ein gewähltes Extra gibt es auf Anfrage. Senden Sie uns Ihre Anfrage, wir melden uns mit einem Angebot.",
};

/** The reason the form already knows before a date is chosen (Stadt, Paket, Extras). */
export function anfrageGrundVorab(a: {
  paket: Pick<BuchungsPaket, "nurAnfrage"> | null;
  stadt: BuchungsStadt | null;
  extras: Pick<BuchungsExtra, "nurAnfrage">[];
}): AnfrageGrund | null {
  if (a.stadt?.zone.nurAnfrage) return "zone";
  if (a.paket?.nurAnfrage) return "paket";
  if (a.extras.some((x) => x.nurAnfrage)) return "extra";
  return null;
}
