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
    ...timestamps,
  },
  (t) => [
    index("rechnungen_kunde_idx").on(t.kundeId),
    index("rechnungen_status_idx").on(t.status),
    check(
      "rechnungen_gestellt_vollstaendig",
      sql`${t.status} = 'entwurf' or (${t.nummer} is not null and ${t.ausgestelltAm} is not null and ${t.faelligAm} is not null and ${t.empfaenger} is not null and ${t.verkaeufer} is not null and ${t.kleinunternehmer} is not null and ${t.summeBrutto} is not null)`,
    ),
  ],
);
