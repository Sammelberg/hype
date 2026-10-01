// The office's data in its own Postgres schema `buero`, beside the CMS (`cms`): customers, orders,
// contracts, invoices, the issuer's details and the number series. Same database, same
// migrations (drizzle.config.ts lists both schema files). Relative imports: scripts load it.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import type { Empfaenger, Firma, KundeInput, Position } from "../logik/typen";

export const buero = pgSchema("buero");

const timestamps = {
  createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
};
const tag = () => date({ mode: "string" });
const geld = () => numeric({ precision: 12, scale: 2 });

export const kundenArt = buero.enum("kunden_art", ["firma", "privat"]);
export const auftragStatus = buero.enum("auftrag_status", [
  "angebot",
  "beauftragt",
  "in_arbeit",
  "abgenommen",
  "abgerechnet",
  "storniert",
]);
export const vertragStatus = buero.enum("vertrag_status", [
  "entwurf",
  "aktiv",
  "gekuendigt",
  "beendet",
]);
export const vertragArt = buero.enum("vertrag_art", [
  "werkvertrag",
  "dienstvertrag",
  "wartung",
  "lizenz",
  "avv",
  "nda",
  "sonstiges",
]);
export const intervall = buero.enum("intervall", ["einmalig", "monatlich", "quartal", "jaehrlich"]);
export const rechnungStatus = buero.enum("rechnung_status", [
  "entwurf",
  "gestellt",
  "bezahlt",
  "storniert",
]);
export const rechnungTyp = buero.enum("rechnung_typ", ["rechnung", "storno"]);
// What kind of invoice (logik/abrechnung.ts): plain, recurring from a contract, on account, final.
export const rechnungArt = buero.enum("rechnung_art", ["normal", "abo", "abschlag", "schluss"]);

// The issuer: one document, like the site settings.
export const firma = buero.table(
  "firma",
  {
    id: integer().primaryKey(),
    data: jsonb().$type<Firma>().notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [check("firma_einzeln", sql`${t.id} = 1`)],
);

// One counter per prefix and year (KD uses year 0). Only ever counts up; a trigger guards it.
export const nummernkreise = buero.table(
  "nummernkreise",
  {
    praefix: varchar({ length: 8 }).notNull(),
    jahr: integer().notNull(),
    letzte: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.praefix, t.jahr] })],
);

export const kunden = buero.table(
  "kunden",
  {
    id: serial().primaryKey(),
    nummer: varchar({ length: 20 }).notNull().unique(),
    art: kundenArt().notNull().default("firma"),
    firma: varchar({ length: 300 }),
    name: varchar({ length: 300 }),
    email: varchar({ length: 320 }),
    telefon: varchar({ length: 40 }),
    strasse: varchar({ length: 300 }),
    plz: varchar({ length: 10 }),
    ort: varchar({ length: 300 }),
    land: varchar({ length: 2 }).notNull().default("DE"),
    ustId: varchar({ length: 20 }),
    leitwegId: varchar({ length: 46 }),
    zahlungszielTage: integer(),
    ansprechpartner: jsonb()
      .$type<KundeInput["ansprechpartner"]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    notizen: text(),
    archiviertAm: timestamp({ withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (t) => [index("kunden_archiviert_idx").on(t.archiviertAm)],
);

export const auftraege = buero.table(
  "auftraege",
  {
    id: serial().primaryKey(),
    nummer: varchar({ length: 20 }).notNull().unique(),
    kundeId: integer()
      .notNull()
      .references(() => kunden.id, { onDelete: "restrict" }),
    titel: varchar({ length: 300 }).notNull(),
    beschreibung: text(),
    status: auftragStatus().notNull().default("angebot"),
    betragNetto: geld(),
    leistungVon: tag(),
    leistungBis: tag(),
    beauftragtAm: tag(),
    abgenommenAm: tag(),
    notizen: text(),
    ...timestamps,
  },
  (t) => [index("auftraege_kunde_idx").on(t.kundeId), index("auftraege_status_idx").on(t.status)],
);

export const vertraege = buero.table(
  "vertraege",
  {
    id: serial().primaryKey(),
    nummer: varchar({ length: 20 }).notNull().unique(),
    kundeId: integer()
      .notNull()
      .references(() => kunden.id, { onDelete: "restrict" }),
    auftragId: integer().references(() => auftraege.id, { onDelete: "set null" }),
    art: vertragArt().notNull(),
    titel: varchar({ length: 300 }).notNull(),
    status: vertragStatus().notNull().default("entwurf"),
    beginn: tag().notNull(),
    laufzeitMonate: integer(),
    verlaengerungMonate: integer(),
    kuendigungsfristMonate: integer().notNull().default(0),
    verguetungNetto: geld(),
    verguetungIntervall: intervall(),
    unterzeichnetAm: tag(),
    gekuendigtAm: tag(),
    endetAm: tag(),
    inhalt: text(),
    // Recurring invoices: on, the fee is billed per period in advance (drafts, the owner issues
    // them); the end of the last period billed.
    aboRechnungen: boolean().notNull().default(false),
    abgerechnetBis: tag(),
    ...timestamps,
  },
  (t) => [index("vertraege_kunde_idx").on(t.kundeId)],
);

// An invoice. A draft has no number; issuing takes the next number, freezes the recipient and
// the issuer as they are that day and the totals — from then on a trigger (migration) lets only
// the status and the payment date change, and refuses to delete it (GoBD). Corrections are Stornos.
export const rechnungen = buero.table(
  "rechnungen",
  {
    id: serial().primaryKey(),
    nummer: varchar({ length: 20 }).unique(),
    typ: rechnungTyp().notNull().default("rechnung"),
    art: rechnungArt().notNull().default("normal"),
    status: rechnungStatus().notNull().default("entwurf"),
    kundeId: integer()
      .notNull()
      .references(() => kunden.id, { onDelete: "restrict" }),
    auftragId: integer().references(() => auftraege.id, { onDelete: "set null" }),
    vertragId: integer().references(() => vertraege.id, { onDelete: "set null" }),
    korrigiertId: integer().references((): AnyPgColumn => rechnungen.id, {
      onDelete: "restrict",
    }),
    leistungVon: tag(),
    leistungBis: tag(),
    zahlungszielTage: integer().notNull().default(14),
    einleitung: text(),
    schlusstext: text(),
    positionen: jsonb().$type<Position[]>().notNull(),
    empfaenger: jsonb().$type<Empfaenger>(),
    verkaeufer: jsonb().$type<Firma>(),
    kleinunternehmer: boolean(),
    ausgestelltAm: tag(),
    faelligAm: tag(),
    summeNetto: geld(),
    summeSteuer: geld(),
    summeBrutto: geld(),
    bezahltAm: tag(),
    // A final invoice: the invoices on account it deducts, frozen when it is issued.
    abschlaege: jsonb().$type<{ id: number; nummer: string; brutto: string }[]>(),
    // The XRechnung as first handed out, and its sha256: written once (migration 0006), so
    // every later download is the same file, whatever the code that builds it becomes.
    archivXml: text(),
    archivSha256: varchar({ length: 64 }),
    ...timestamps,
  },
  (t) => [
    index("rechnungen_kunde_idx").on(t.kundeId),
    index("rechnungen_status_idx").on(t.status),
    // A contract's period is billed once (a cancelled invoice frees it again).
    uniqueIndex("rechnungen_abo_zeitraum")
      .on(t.vertragId, t.leistungVon)
      .where(sql`${t.art} = 'abo' and ${t.typ} = 'rechnung' and ${t.status} <> 'storniert'`),
    check(
      "rechnungen_gestellt_vollstaendig",
      sql`${t.status} = 'entwurf' or (${t.nummer} is not null and ${t.ausgestelltAm} is not null and ${t.faelligAm} is not null and ${t.empfaenger} is not null and ${t.verkaeufer} is not null and ${t.kleinunternehmer} is not null and ${t.summeBrutto} is not null)`,
    ),
  ],
);

// ---------------------------------------------------------------------------------------------
// The customer's history beside the documents: notes, calls, mails, meetings — and what is to be
// picked up again on a day (Wiedervorlage), with or without a customer.

export const historieArt = buero.enum("historie_art", ["notiz", "anruf", "email", "termin"]);

export const kundenHistorie = buero.table(
  "kunden_historie",
  {
    id: serial().primaryKey(),
    kundeId: integer()
      .notNull()
      .references(() => kunden.id, { onDelete: "cascade" }),
    art: historieArt().notNull().default("notiz"),
    text: text().notNull(),
    am: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
    autor: varchar({ length: 200 }),
    createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("kunden_historie_kunde_idx").on(t.kundeId, t.am)],
);

export const wiedervorlagen = buero.table(
  "wiedervorlagen",
  {
    id: serial().primaryKey(),
    kundeId: integer().references(() => kunden.id, { onDelete: "cascade" }),
    auftragId: integer().references(() => auftraege.id, { onDelete: "set null" }),
    vertragId: integer().references(() => vertraege.id, { onDelete: "set null" }),
    rechnungId: integer().references(() => rechnungen.id, { onDelete: "set null" }),
    titel: varchar({ length: 300 }).notNull(),
    notiz: text(),
    faelligAm: tag().notNull(),
    erledigtAm: timestamp({ withTimezone: true, mode: "date" }),
    createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("wiedervorlagen_offen_idx").on(t.erledigtAm, t.faelligAm),
    index("wiedervorlagen_kunde_idx").on(t.kundeId),
  ],
);

// ---------------------------------------------------------------------------------------------
// What came in against an issued invoice, and the reminders sent for it. An invoice counts as
// paid once its payments cover the gross; a Mahnung is a letter that went out and stays as
// written (migration 0008 refuses changes).

export const zahlungen = buero.table(
  "zahlungen",
  {
    id: serial().primaryKey(),
    rechnungId: integer()
      .notNull()
      .references(() => rechnungen.id, { onDelete: "restrict" }),
    betrag: geld().notNull(),
    am: tag().notNull(),
    notiz: varchar({ length: 300 }),
    createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("zahlungen_rechnung_idx").on(t.rechnungId),
    check("zahlungen_betrag_positiv", sql`${t.betrag} > 0`),
  ],
);

export const mahnungen = buero.table(
  "mahnungen",
  {
    id: serial().primaryKey(),
    rechnungId: integer()
      .notNull()
      .references(() => rechnungen.id, { onDelete: "restrict" }),
    stufe: integer().notNull(),
    am: tag().notNull(),
    frist: tag().notNull(),
    offen: geld().notNull(),
    verzugSeit: tag(),
    zinssatz: numeric({ precision: 5, scale: 2 }).notNull().default("0"),
    zinsen: geld().notNull().default("0"),
    pauschale: geld().notNull().default("0"),
    gebuehr: geld().notNull().default("0"),
    gesamt: geld().notNull(),
    text: text(),
    createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("mahnungen_rechnung_idx").on(t.rechnungId),
    check("mahnungen_stufe", sql`${t.stufe} between 0 and 2`),
  ],
);

// ---------------------------------------------------------------------------------------------
// Offers as documents: positions like an invoice, a number (AN-YYYY-NNNN) when sent, valid until
// a day; accepted, an offer becomes (or starts) the order.

export const angebotStatus = buero.enum("angebot_status", [
  "entwurf",
  "versendet",
  "angenommen",
  "abgelehnt",
]);

export const angebote = buero.table(
  "angebote",
  {
    id: serial().primaryKey(),
    nummer: varchar({ length: 20 }).unique(),
    kundeId: integer()
      .notNull()
      .references(() => kunden.id, { onDelete: "restrict" }),
    auftragId: integer().references(() => auftraege.id, { onDelete: "set null" }),
    titel: varchar({ length: 300 }).notNull(),
    einleitung: text(),
    schlusstext: text(),
    positionen: jsonb().$type<Position[]>().notNull(),
    gueltigBis: tag(),
    status: angebotStatus().notNull().default("entwurf"),
    versendetAm: tag(),
    entschiedenAm: tag(),
    ...timestamps,
  },
  (t) => [index("angebote_kunde_idx").on(t.kundeId), index("angebote_status_idx").on(t.status)],
);
