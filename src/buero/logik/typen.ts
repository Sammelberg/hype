// The office's documents as the admin edits them: zod schemas with German messages, shared by the
// forms (client) and the actions and repositories (server). Pure, no database.
import { z } from "zod";

const text = (was: string, max = 300) =>
  z.string().trim().min(1, `Bitte geben Sie ${was} an.`).max(max);
const optional = (max = 300) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));
const tagIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein Datum wählen.");
const optionalerTag = tagIso.nullish().transform((v) => v ?? null);
const email = z
  .union([z.literal(""), z.email("Bitte eine gültige E-Mail-Adresse.")])
  .nullish()
  .transform((v) => (v ? v : null));
const plz = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^\d{5}$/, "Fünf Ziffern."),
  ])
  .nullish()
  .transform((v) => (v ? v : null));
const betrag = z.coerce
  .number({ error: "Bitte einen Betrag." })
  .refine((n) => Number.isFinite(n), "Bitte einen Betrag.")
  .refine((n) => Math.abs(n) < 1e9, "Zu groß.");

// ---------------------------------------------------------------------------------------------
// Firmendaten: who issues the invoices. Empty fields are allowed while editing; issuing an invoice
// checks what §14 UStG and XRechnung require (pflichtangaben.ts).

export const FirmaSchema = z.object({
  name: text("den Namen des Unternehmens"),
  inhaber: optional(),
  strasse: optional(),
  plz,
  ort: optional(),
  steuernummer: optional(40),
  ustId: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .regex(/^DE\d{9}$/, "DE und neun Ziffern."),
    ])
    .nullish()
    .transform((v) => (v ? v : null)),
  kleinunternehmer: z.boolean(),
  iban: z
    .union([
      z.literal(""),
      z
        .string()
        .transform((v) => v.replace(/\s+/g, "").toUpperCase())
        .pipe(z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, "Keine gültige IBAN.")),
    ])
    .nullish()
    .transform((v) => (v ? v : null)),
  bic: optional(11),
  bank: optional(),
  telefon: optional(40),
  email,
  zahlungszielTage: z.coerce.number().int().min(0).max(120),
  fusszeile: optional(1000),
  // §247 BGB, published by the Bundesbank for 1 January and 1 July; Mahnungen compute interest on
  // it. Entered by the owner, never assumed.
  basiszinssatz: z.coerce
    .number()
    .min(-5)
    .max(15)
    .nullish()
    .transform((v) => v ?? null),
  // DATEV export (logik/export.ts): the adviser's numbers; accounts default to SKR03.
  datev: z
    .object({
      beraternummer: z.coerce.number().int().min(1000, "Vier- bis siebenstellig.").max(9999999),
      mandantennummer: z.coerce.number().int().min(1).max(99999),
      kontenrahmen: z.enum(["03", "04"]),
      sachkontenlaenge: z.coerce.number().int().min(4).max(8),
      debitor: z.coerce.number().int().min(1),
      erloes19: z.coerce.number().int().min(1),
      erloes7: z.coerce.number().int().min(1),
      erloes0: z.coerce.number().int().min(1),
    })
    .nullish()
    .transform((v) => v ?? null),
});
export type Firma = z.infer<typeof FirmaSchema>;
export type FirmaInput = z.input<typeof FirmaSchema>;

// ---------------------------------------------------------------------------------------------
// Kunden

export const AnsprechpartnerSchema = z.object({
  id: z.string().min(1),
  name: text("den Namen"),
  rolle: optional(),
  email,
  telefon: optional(40),
});

export const KundeSchema = z
  .object({
    art: z.enum(["firma", "privat"]),
    firma: optional(),
    name: optional(),
    email,
    telefon: optional(40),
    strasse: optional(),
    plz,
    ort: optional(),
    land: z
      .string()
      .trim()
      .regex(/^[A-Z]{2}$/, "Ländercode, etwa DE."),
    ustId: optional(20),
    leitwegId: optional(46),
    zahlungszielTage: z.coerce
      .number()
      .int()
      .min(0)
      .max(120)
      .nullish()
      .transform((v) => v ?? null),
    ansprechpartner: z.array(AnsprechpartnerSchema),
    notizen: optional(5000),
  })
  .refine((k) => (k.art === "firma" ? Boolean(k.firma) : Boolean(k.name)), {
    message: "Bitte geben Sie den Namen an.",
    path: ["name"],
  });
export type KundeInput = z.infer<typeof KundeSchema>;

// ---------------------------------------------------------------------------------------------
// Aufträge

export const AuftragSchema = z.object({
  kundeId: z.number({ error: "Bitte einen Kunden wählen." }).int().positive(),
  titel: text("einen Titel"),
  beschreibung: optional(10000),
  betragNetto: betrag.nullish().transform((v) => v ?? null),
  leistungVon: optionalerTag,
  leistungBis: optionalerTag,
  notizen: optional(5000),
});
export type AuftragInput = z.infer<typeof AuftragSchema>;

// ---------------------------------------------------------------------------------------------
// Verträge

export const VERTRAGSARTEN = {
  werkvertrag: "Werkvertrag",
  dienstvertrag: "Dienstvertrag",
  wartung: "Wartung und Betrieb",
  lizenz: "Lizenz",
  avv: "Auftragsverarbeitung (AVV)",
  nda: "Vertraulichkeit (NDA)",
  sonstiges: "Sonstiger Vertrag",
} as const;
export const INTERVALLE = {
  einmalig: "einmalig",
  monatlich: "monatlich",
  quartal: "vierteljährlich",
  jaehrlich: "jährlich",
} as const;

const monate = z.coerce
  .number()
  .int()
  .min(1)
  .max(240)
  .nullish()
  .transform((v) => v ?? null);

export const VertragSchema = z.object({
  kundeId: z.number({ error: "Bitte einen Kunden wählen." }).int().positive(),
  auftragId: z
    .number()
    .int()
    .positive()
    .nullish()
    .transform((v) => v ?? null),
  art: z.enum(Object.keys(VERTRAGSARTEN) as [keyof typeof VERTRAGSARTEN]),
  titel: text("einen Titel"),
  beginn: tagIso,
  laufzeitMonate: monate,
  verlaengerungMonate: monate,
  kuendigungsfristMonate: z.coerce.number().int().min(0).max(24),
  verguetungNetto: betrag.nullish().transform((v) => v ?? null),
  verguetungIntervall: z
    .enum(Object.keys(INTERVALLE) as [keyof typeof INTERVALLE])
    .nullish()
    .transform((v) => v ?? null),
  unterzeichnetAm: optionalerTag,
  inhalt: optional(20000),
  aboRechnungen: z.boolean().default(false),
});
export type VertragInput = z.infer<typeof VertragSchema>;

// ---------------------------------------------------------------------------------------------
// Rechnungen

// UN/ECE Recommendation 20 codes, as XRechnung wants them (BT-130).
export const EINHEITEN = {
  HUR: "Stunde",
  DAY: "Tag",
  MON: "Monat",
  C62: "Stück",
  LS: "Pauschale",
} as const;
export type Einheit = keyof typeof EINHEITEN;

export const PositionSchema = z.object({
  id: z.string().min(1),
  bezeichnung: text("die Leistung", 500),
  menge: z.coerce.number({ error: "Bitte eine Menge." }).refine((n) => n !== 0, "Nicht null."),
  einheit: z.enum(Object.keys(EINHEITEN) as [Einheit]),
  einzelpreis: betrag,
  // Standard rates only; a Kleinunternehmer's invoice ignores them (§19, category E).
  ustSatz: z.union([z.literal(19), z.literal(7)]),
});
export type Position = z.infer<typeof PositionSchema>;

export const RechnungSchema = z.object({
  // „abo“ is set by the contract's billing, not chosen.
  art: z.enum(["normal", "abo", "abschlag", "schluss"]).default("normal"),
  kundeId: z.number({ error: "Bitte einen Kunden wählen." }).int().positive(),
  auftragId: z
    .number()
    .int()
    .positive()
    .nullish()
    .transform((v) => v ?? null),
  vertragId: z
    .number()
    .int()
    .positive()
    .nullish()
    .transform((v) => v ?? null),
  leistungVon: optionalerTag,
  leistungBis: optionalerTag,
  zahlungszielTage: z.coerce.number().int().min(0).max(120),
  einleitung: optional(2000),
  schlusstext: optional(2000),
  positionen: z.array(PositionSchema).min(1, "Mindestens eine Position."),
});
export type RechnungInput = z.infer<typeof RechnungSchema>;

/** An invoice on account as a final invoice deducts it (gross as numeric text, groups in cents). */
export type Abschlag = {
  id: number;
  nummer: string;
  brutto: string;
  gruppen?: { satz: number; netto: number; steuer: number }[];
};

// Who the invoice goes to and who issues it, frozen with the invoice when it is issued.
export type Empfaenger = {
  name: string;
  firma: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  land: string;
  ustId: string | null;
  leitwegId: string | null;
  email: string | null;
  privat: boolean;
};

// ---------------------------------------------------------------------------------------------
// Kundenhistorie, Wiedervorlagen

export const HISTORIE_ARTEN = {
  notiz: "Notiz",
  anruf: "Anruf",
  email: "E-Mail",
  termin: "Termin",
} as const;

export const HistorieSchema = z.object({
  kundeId: z.number().int().positive(),
  art: z.enum(Object.keys(HISTORIE_ARTEN) as [keyof typeof HISTORIE_ARTEN]),
  text: text("einen Text", 5000),
});
export type HistorieInput = z.infer<typeof HistorieSchema>;

const optionaleId = z
  .number()
  .int()
  .positive()
  .nullish()
  .transform((v) => v ?? null);

export const WiedervorlageSchema = z.object({
  kundeId: optionaleId,
  auftragId: optionaleId,
  vertragId: optionaleId,
  rechnungId: optionaleId,
  titel: text("worum es geht"),
  notiz: optional(2000),
  faelligAm: tagIso,
});
export type WiedervorlageInput = z.infer<typeof WiedervorlageSchema>;

// ---------------------------------------------------------------------------------------------
// Zahlungen, Mahnungen

export const ZahlungSchema = z.object({
  rechnungId: z.number().int().positive(),
  betrag: betrag.refine((n) => n > 0, "Mehr als null."),
  am: tagIso,
  notiz: optional(300),
});
export type ZahlungInput = z.infer<typeof ZahlungSchema>;

const nichtNegativ = betrag.refine((n) => n >= 0, "Nicht negativ.");

export const MahnungSchema = z.object({
  rechnungId: z.number().int().positive(),
  am: tagIso,
  frist: tagIso,
  zinssatz: z.coerce.number().min(0).max(30),
  zinsen: nichtNegativ,
  pauschale: nichtNegativ,
  gebuehr: nichtNegativ,
  text: optional(3000),
});
export type MahnungInput = z.infer<typeof MahnungSchema>;

// ---------------------------------------------------------------------------------------------
// Angebote

export const AngebotSchema = z.object({
  kundeId: z.number({ error: "Bitte einen Kunden wählen." }).int().positive(),
  auftragId: optionaleId,
  titel: text("einen Titel"),
  einleitung: optional(4000),
  schlusstext: optional(4000),
  gueltigBis: optionalerTag,
  positionen: z.array(PositionSchema).min(1, "Mindestens eine Position."),
});
export type AngebotInput = z.infer<typeof AngebotSchema>;

// ---------------------------------------------------------------------------------------------
// Termine: entered as German days and wall-clock times; the server turns them into instants.

const uhrzeit = z.string().regex(/^\d{2}:\d{2}$/, "Bitte eine Uhrzeit.");

export const TerminSchema = z
  .object({
    titel: text("worum es geht"),
    datum: tagIso,
    bisDatum: optionalerTag,
    ganztags: z.boolean(),
    von: uhrzeit.nullish().transform((v) => v ?? null),
    bis: uhrzeit.nullish().transform((v) => v ?? null),
    ort: optional(300),
    notiz: optional(4000),
    kundeId: optionaleId,
  })
  .refine((t) => t.ganztags || t.von !== null, {
    message: "Bitte eine Uhrzeit, oder ganztägig.",
    path: ["von"],
  })
  .refine((t) => !t.bisDatum || t.bisDatum >= t.datum, {
    message: "Das Ende liegt nach dem Beginn.",
    path: ["bisDatum"],
  })
  .refine(
    (t) =>
      t.ganztags ||
      !t.bis ||
      (t.bisDatum ?? t.datum) > t.datum ||
      (t.von !== null && t.bis > t.von),
    { message: "Das Ende liegt nach dem Beginn.", path: ["bis"] },
  );
export type TerminInput = z.infer<typeof TerminSchema>;
