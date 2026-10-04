// The booking domain's master data as the admin edits it: zod schemas with German messages, shared
// by the forms (client) and the actions and repositories (server). Pure, no database.
import { z } from "zod";

import { FIGUR_KATEGORIEN, SPRACHEN } from "./typen";

const text = (was: string, max = 200) =>
  z.string().trim().min(1, `Bitte geben Sie ${was} an.`).max(max, "Der Text ist zu lang.");
const optional = (max = 300) =>
  z
    .string()
    .trim()
    .max(max, "Der Text ist zu lang.")
    .nullish()
    .transform((v) => (v ? v : null));
const langtext = optional(5000);
const slug = z
  .string()
  .trim()
  .min(1, "Bitte eine Adresse angeben.")
  .max(120, "Die Adresse ist zu lang.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Nur Kleinbuchstaben, Ziffern und Bindestriche.");
const ganzzahl = (min: number, max: number) =>
  z
    .number({ error: "Bitte eine Zahl." })
    .int("Bitte eine ganze Zahl.")
    .min(min, `Mindestens ${min}.`)
    .max(max, `Höchstens ${max}.`);
const euro = z
  .number({ error: "Bitte einen Betrag." })
  .min(0, "Nicht negativ.")
  .max(100_000, "Zu groß.")
  .refine((n) => Math.round(n * 100) === n * 100, "Höchstens zwei Nachkommastellen.");
const liste = z
  .array(z.string().trim().max(200, "Ein Punkt ist zu lang."))
  .transform((zeilen) => zeilen.filter(Boolean));
const email = z
  .union([z.literal(""), z.email("Bitte eine gültige E-Mail-Adresse.")])
  .nullish()
  .transform((v) => (v ? v : null));
const uhrzeit = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Bitte eine Uhrzeit wie 10:00.");

/** A web address from a German name: „Märchenfee & Zauberer“ → „maerchenfee-zauberer“. */
export const slugAus = (name: string) =>
  name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

export const minutenAusUhrzeit = (hhmm: string) =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
export const uhrzeitAusMinuten = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const FigurSchema = z
  .object({
    slug,
    name: text("den Namen der Figur"),
    kategorie: z.enum(FIGUR_KATEGORIEN, { error: "Bitte eine Kategorie wählen." }),
    alterVon: ganzzahl(0, 18),
    alterBis: ganzzahl(0, 18),
    sprachen: z.array(z.enum(SPRACHEN)).min(1, "Bitte mindestens eine Sprache wählen."),
    kurz: optional(300),
    beschreibung: langtext,
    programm: liste,
    aktiv: z.boolean(),
    sort: ganzzahl(-1000, 1000),
    /** Media ids in display order; the first is the card's picture. */
    fotos: z.array(z.number().int().positive()).max(30, "Höchstens 30 Fotos."),
    metaTitle: optional(200),
    metaDescription: optional(300),
  })
  .superRefine((f, ctx) => {
    if (f.alterBis < f.alterVon)
      ctx.addIssue({
        code: "custom",
        path: ["alterBis"],
        message: "Das Höchstalter liegt unter dem Mindestalter.",
      });
  });
export type FigurInput = z.input<typeof FigurSchema>;
export type Figur = z.output<typeof FigurSchema>;

export const DarstellerSchema = z.object({
  name: text("den Namen"),
  email,
  telefon: optional(40),
  aktiv: z.boolean(),
  prioritaet: ganzzahl(0, 1000),
  notiz: langtext,
  /** The Figuren this person plays. */
  figuren: z.array(z.number().int().positive()),
});
export type DarstellerInput = z.input<typeof DarstellerSchema>;
export type Darsteller = z.output<typeof DarstellerSchema>;

export const PaketSchema = z
  .object({
    slug,
    name: text("den Namen des Pakets"),
    beschreibung: langtext,
    leistungen: liste,
    dauerMin: ganzzahl(1, 24 * 60).nullable(),
    preis: euro.nullable(),
    figurenAnzahl: ganzzahl(1, 2),
    nurAnfrage: z.boolean(),
    aktiv: z.boolean(),
    sort: ganzzahl(-1000, 1000),
  })
  .superRefine((p, ctx) => {
    if (p.nurAnfrage) return;
    if (p.dauerMin === null)
      ctx.addIssue({
        code: "custom",
        path: ["dauerMin"],
        message: "Ein buchbares Paket braucht eine Dauer.",
      });
    if (p.preis === null)
      ctx.addIssue({
        code: "custom",
        path: ["preis"],
        message: "Ein buchbares Paket braucht einen Preis.",
      });
  });
export type PaketInput = z.input<typeof PaketSchema>;
export type Paket = z.output<typeof PaketSchema>;

export const ExtraSchema = z.object({
  slug,
  name: text("den Namen des Extras"),
  beschreibung: langtext,
  preis: euro.nullable(),
  dauerDeltaMin: ganzzahl(0, 240),
  vorlaufTage: ganzzahl(0, 60),
  zusatzFigur: z.boolean(),
  nurAnfrage: z.boolean(),
  aktiv: z.boolean(),
  sort: ganzzahl(-1000, 1000),
});
export type ExtraInput = z.input<typeof ExtraSchema>;
export type Extra = z.output<typeof ExtraSchema>;

export const ZoneSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z]{1,2}$/, "Ein oder zwei Großbuchstaben, z. B. A."),
  name: text("den Namen der Zone", 100),
  aufschlag: euro,
  fahrtMinuten: ganzzahl(0, 600),
  nurAnfrage: z.boolean(),
  sort: ganzzahl(-1000, 1000),
});
export type ZoneInput = z.input<typeof ZoneSchema>;
export type Zone = z.output<typeof ZoneSchema>;

export const StadtSchema = z
  .object({
    name: text("den Namen des Orts", 120),
    slug,
    zoneCode: z.string().trim().min(1, "Bitte eine Zone wählen."),
    seite: z.boolean(),
    intro: langtext,
    bezirke: langtext,
    orte: langtext,
    bedingungen: langtext,
    metaTitle: optional(200),
    metaDescription: optional(300),
    sort: ganzzahl(-1000, 1000),
  })
  .superRefine((s, ctx) => {
    if (s.seite && !s.intro)
      ctx.addIssue({
        code: "custom",
        path: ["intro"],
        message: "Eine eigene Seite braucht einen Einleitungstext.",
      });
  });
export type StadtInput = z.input<typeof StadtSchema>;
export type Stadt = z.output<typeof StadtSchema>;

export const EinstellungenSchema = z
  .object({
    vorbereitungMin: ganzzahl(0, 240),
    abbauMin: ganzzahl(0, 240),
    rasterMin: ganzzahl(5, 240),
    ersterStart: uhrzeit,
    letzterStart: uhrzeit,
    anzahlungProzent: z
      .number({ error: "Bitte eine Zahl." })
      .int("Bitte eine ganze Zahl.")
      .min(0, "Zwischen 0 und 100 %.")
      .max(100, "Zwischen 0 und 100 %."),
    haltenMin: ganzzahl(5, 24 * 60),
    haltenLastschriftMin: ganzzahl(5, 14 * 24 * 60),
    mindestVorlaufStd: ganzzahl(0, 14 * 24),
  })
  .superRefine((e, ctx) => {
    if (minutenAusUhrzeit(e.letzterStart) < minutenAusUhrzeit(e.ersterStart))
      ctx.addIssue({
        code: "custom",
        path: ["letzterStart"],
        message: "Der letzte Beginn liegt vor dem ersten.",
      });
  });
export type EinstellungenInput = z.input<typeof EinstellungenSchema>;
export type Einstellungen = z.output<typeof EinstellungenSchema>;

const tag = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein Datum wählen.");
const id = (was: string) =>
  z
    .number({ error: `Bitte ${was} wählen.` })
    .int()
    .positive(`Bitte ${was} wählen.`);

/** An order taken by phone or Instagram, entered by the owner: confirmed at once. */
export const ManuelleBuchungSchema = z.object({
  figurId: id("eine Figur"),
  zweiteFigurId: z.number().int().positive().nullable(),
  paketId: id("ein Paket"),
  extraIds: z.array(z.number().int().positive()),
  stadtId: id("einen Ort"),
  tag,
  uhrzeit,
  quelle: z.enum(["telefon", "instagram", "admin"]),
  zahlungsart: z.enum(["rechnung", "mollie"]),
  kontaktName: text("den Namen"),
  kontaktEmail: z.email("Bitte eine gültige E-Mail-Adresse."),
  kontaktTelefon: optional(40),
  strasse: optional(300),
  plz: optional(10),
  ort: optional(200),
  kindName: optional(100),
  kindAlter: ganzzahl(0, 18).nullable(),
  kinderAnzahl: ganzzahl(1, 200).nullable(),
  notizKunde: langtext,
});
export type ManuelleBuchungInput = z.input<typeof ManuelleBuchungSchema>;

/** Time off for a Darsteller, in German days and times. */
export const SperreSchema = z
  .object({
    darstellerId: id("einen Darsteller"),
    vonTag: tag,
    vonZeit: uhrzeit,
    bisTag: tag,
    bisZeit: uhrzeit,
    grund: optional(300),
  })
  .superRefine((s, ctx) => {
    if (`${s.bisTag}T${s.bisZeit}` <= `${s.vonTag}T${s.vonZeit}`)
      ctx.addIssue({
        code: "custom",
        path: ["bisZeit"],
        message: "Das Ende muss nach dem Beginn liegen.",
      });
  });
export type SperreInput = z.input<typeof SperreSchema>;

/**
 * A booking or an Anfrage as the website's form sends it. Contact and address are required: the
 * Darsteller has to find the party and reach someone on the day.
 */
export const BuchenSchema = z
  .object({
    art: z.enum(["buchung", "anfrage"]),
    figurId: id("eine Figur"),
    zweiteFigurId: z.number().int().positive().nullable(),
    paketId: id("ein Paket"),
    extraIds: z.array(z.number().int().positive()).max(20),
    stadtId: id("einen Ort"),
    tag,
    uhrzeit,
    zahlungsart: z.enum(["mollie", "rechnung"]),
    rechnungAn: optional(200),
    kontaktName: text("Ihren Namen"),
    kontaktEmail: z.email("Bitte eine gültige E-Mail-Adresse."),
    kontaktTelefon: z
      .string()
      .trim()
      .regex(
        /^\+?[\d\s/()-]{6,30}$/,
        "Bitte eine Telefonnummer, unter der Sie am Tag erreichbar sind.",
      ),
    strasse: text("Straße und Hausnummer", 300),
    plz: z
      .string()
      .trim()
      .regex(/^\d{5}$/, "Bitte eine fünfstellige Postleitzahl."),
    ort: text("den Ort", 200),
    kindName: optional(100),
    kindAlter: ganzzahl(1, 18).nullable(),
    kinderAnzahl: ganzzahl(1, 200).nullable(),
    sprache: z.enum(SPRACHEN).nullable(),
    notizKunde: optional(2000),
    bedingungen: z.literal(true, {
      error: "Bitte bestätigen Sie, dass Sie die Bedingungen gelesen haben.",
    }),
  })
  .superRefine((b, ctx) => {
    if (b.zahlungsart === "rechnung" && !b.rechnungAn)
      ctx.addIssue({
        code: "custom",
        path: ["rechnungAn"],
        message: "Bitte nennen Sie die Kita, Schule oder Firma, an die die Rechnung geht.",
      });
  });
export type BuchenInput = z.input<typeof BuchenSchema>;
export type Buchen = z.output<typeof BuchenSchema>;
