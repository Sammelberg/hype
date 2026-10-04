// The booking domain of this project in its own Postgres schema `buchung`: characters, performers,
// zones and cities, packages, extras, bookings, occupancy, payments and reviews. It has its own
// migration track (drizzle.buchung.config.ts → src/buchung/migrations), so kern's migrations stay
// untouched. Relative imports: scripts load it.
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
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { kunden } from "../../buero/db/schema";
import { media } from "../../cms/db/schema";
import {
  BUCHUNG_QUELLEN,
  BUCHUNG_STATUS,
  FIGUR_KATEGORIEN,
  SPRACHEN,
  ZAHLUNG_ADAPTER,
  type PreisPosition,
} from "../logik/typen";

export const buchungSchema = pgSchema("buchung");

const timestamps = {
  createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
};
const zeitpunkt = () => timestamp({ withTimezone: true, mode: "date" });
const geld = () => numeric({ precision: 12, scale: 2 });
const SLUG = sql`'^[a-z0-9]+(-[a-z0-9]+)*$'`;

export const figurKategorie = buchungSchema.enum("figur_kategorie", FIGUR_KATEGORIEN);
export const sprache = buchungSchema.enum("sprache", SPRACHEN);
export const buchungStatus = buchungSchema.enum("buchung_status", BUCHUNG_STATUS);
export const buchungQuelle = buchungSchema.enum("buchung_quelle", BUCHUNG_QUELLEN);
export const belegungArt = buchungSchema.enum("belegung_art", ["einsatz", "sperre"]);
export const zahlungAdapter = buchungSchema.enum("zahlung_adapter", ZAHLUNG_ADAPTER);
export const zahlungArt = buchungSchema.enum("zahlung_art", ["anzahlung", "rest", "erstattung"]);
export const zahlungStatus = buchungSchema.enum("zahlung_status", [
  "offen",
  "bezahlt",
  "fehlgeschlagen",
  "abgebrochen",
  "erstattet",
]);

// Who comes: a descriptive character, never a licensed name (trademark risk).
export const figuren = buchungSchema.table(
  "figuren",
  {
    id: serial().primaryKey(),
    slug: varchar({ length: 120 }).notNull().unique(),
    name: varchar({ length: 200 }).notNull(),
    kategorie: figurKategorie().notNull(),
    alterVon: smallint().notNull().default(3),
    alterBis: smallint().notNull().default(10),
    sprachen: sprache()
      .array()
      .notNull()
      .default(sql`'{de}'`),
    kurz: varchar({ length: 300 }),
    beschreibung: text(),
    programm: text()
      .array()
      .notNull()
      .default(sql`'{}'`),
    aktiv: boolean().notNull().default(true),
    sort: integer().notNull().default(0),
    metaTitle: varchar({ length: 200 }),
    metaDescription: varchar({ length: 300 }),
    ...timestamps,
  },
  (t) => [
    check("figuren_slug_format", sql`${t.slug} ~ ${SLUG}`),
    check("figuren_alter", sql`${t.alterVon} >= 0 AND ${t.alterBis} >= ${t.alterVon}`),
  ],
);

export const figurFotos = buchungSchema.table(
  "figur_fotos",
  {
    figurId: integer()
      .notNull()
      .references(() => figuren.id, { onDelete: "cascade" }),
    mediaId: integer()
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    sort: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.figurId, t.mediaId] })],
);

export const darsteller = buchungSchema.table("darsteller", {
  id: serial().primaryKey(),
  name: varchar({ length: 200 }).notNull(),
  email: varchar({ length: 320 }),
  telefon: varchar({ length: 40 }),
  aktiv: boolean().notNull().default(true),
  // Lower goes first when several performers are free for the same slot.
  prioritaet: integer().notNull().default(100),
  notiz: text(),
  ...timestamps,
});

// Which performer can play which character — the basis of availability.
export const darstellerFiguren = buchungSchema.table(
  "darsteller_figuren",
  {
    darstellerId: integer()
      .notNull()
      .references(() => darsteller.id, { onDelete: "cascade" }),
    figurId: integer()
      .notNull()
      .references(() => figuren.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.darstellerId, t.figurId] }),
    index("darsteller_figuren_figur_idx").on(t.figurId),
  ],
);

// Pricing by zone, not by kilometre: the surcharge and the one-way travel time.
export const zonen = buchungSchema.table("zonen", {
  code: varchar({ length: 2 }).primaryKey(),
  name: varchar({ length: 100 }).notNull(),
  aufschlag: geld().notNull().default("0"),
  fahrtMinuten: integer().notNull(),
  nurAnfrage: boolean().notNull().default(false),
  sort: integer().notNull().default(0),
});

// A city the customer picks; with a landing page of its own at /kindergeburtstag/<slug>.
export const staedte = buchungSchema.table(
  "staedte",
  {
    id: serial().primaryKey(),
    name: varchar({ length: 120 }).notNull(),
    slug: varchar({ length: 120 }).notNull().unique(),
    zoneCode: varchar({ length: 2 })
      .notNull()
      .references(() => zonen.code, { onDelete: "restrict" }),
    // The landing page: only cities with a real text get one (thin pages get merged by Google).
    seite: boolean().notNull().default(false),
    intro: text(),
    bezirke: text(),
    orte: text(),
    bedingungen: text(),
    metaTitle: varchar({ length: 200 }),
    metaDescription: varchar({ length: 300 }),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check("staedte_slug_format", sql`${t.slug} ~ ${SLUG}`),
    index("staedte_zone_idx").on(t.zoneCode),
  ],
);

// How long and with what — independent of who comes.
export const pakete = buchungSchema.table(
  "pakete",
  {
    id: serial().primaryKey(),
    slug: varchar({ length: 120 }).notNull().unique(),
    name: varchar({ length: 200 }).notNull(),
    beschreibung: text(),
    leistungen: text()
      .array()
      .notNull()
      .default(sql`'{}'`),
    dauerMin: integer(),
    preis: geld(),
    figurenAnzahl: smallint().notNull().default(1),
    nurAnfrage: boolean().notNull().default(false),
    aktiv: boolean().notNull().default(true),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check("pakete_figuren_anzahl", sql`${t.figurenAnzahl} BETWEEN 1 AND 2`),
    // A package that books itself needs a duration and a price.
    check("pakete_buchbar", sql`${t.nurAnfrage} OR (${t.dauerMin} > 0 AND ${t.preis} IS NOT NULL)`),
  ],
);

export const extras = buchungSchema.table(
  "extras",
  {
    id: serial().primaryKey(),
    slug: varchar({ length: 120 }).notNull().unique(),
    name: varchar({ length: 200 }).notNull(),
    beschreibung: text(),
    preis: geld(),
    // How much longer the visit gets (face paint), and how many days ahead it must be ordered.
    dauerDeltaMin: integer().notNull().default(0),
    vorlaufTage: integer().notNull().default(0),
    // A second character: needs a second free performer.
    zusatzFigur: boolean().notNull().default(false),
    nurAnfrage: boolean().notNull().default(false),
    aktiv: boolean().notNull().default(true),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check("extras_dauer", sql`${t.dauerDeltaMin} >= 0`),
    check("extras_vorlauf", sql`${t.vorlaufTage} >= 0`),
  ],
);

// One row: the rules of the booking engine, editable in the admin.
export const einstellungen = buchungSchema.table(
  "einstellungen",
  {
    id: integer().primaryKey(),
    vorbereitungMin: integer().notNull().default(20),
    abbauMin: integer().notNull().default(15),
    rasterMin: integer().notNull().default(30),
    // Start times offered, in minutes after midnight Berlin time (10:00 … 18:00).
    ersterStartMin: integer().notNull().default(600),
    letzterStartMin: integer().notNull().default(1080),
    anzahlungProzent: smallint().notNull().default(25),
    haltenMin: integer().notNull().default(30),
    // A direct debit takes days to settle; the slot is held that long.
    haltenLastschriftMin: integer().notNull().default(4320),
    mindestVorlaufStd: integer().notNull().default(48),
    updatedAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    check("einstellungen_einzeln", sql`${t.id} = 1`),
    check("einstellungen_anzahlung", sql`${t.anzahlungProzent} BETWEEN 0 AND 100`),
    check(
      "einstellungen_starts",
      sql`${t.ersterStartMin} >= 0 AND ${t.letzterStartMin} >= ${t.ersterStartMin} AND ${t.letzterStartMin} < 1440`,
    ),
  ],
);

export const buchungen = buchungSchema.table(
  "buchungen",
  {
    id: serial().primaryKey(),
    nummer: varchar({ length: 20 }).notNull().unique(),
    status: buchungStatus().notNull().default("anfrage"),
    quelle: buchungQuelle().notNull().default("web"),
    paketId: integer().references(() => pakete.id, { onDelete: "restrict" }),
    figurId: integer().references(() => figuren.id, { onDelete: "restrict" }),
    zweiteFigurId: integer().references((): AnyPgColumn => figuren.id, { onDelete: "restrict" }),
    // The party's start (UTC); the window is the whole time the performers are taken.
    beginn: zeitpunkt().notNull(),
    fensterVon: zeitpunkt(),
    fensterBis: zeitpunkt(),
    stadtId: integer().references(() => staedte.id, { onDelete: "set null" }),
    zoneCode: varchar({ length: 2 }).references(() => zonen.code, { onDelete: "restrict" }),
    ortFreitext: varchar({ length: 200 }),
    strasse: varchar({ length: 300 }),
    plz: varchar({ length: 10 }),
    ort: varchar({ length: 200 }),
    kontaktName: varchar({ length: 200 }).notNull(),
    kontaktEmail: varchar({ length: 320 }).notNull(),
    kontaktTelefon: varchar({ length: 40 }),
    kindName: varchar({ length: 100 }),
    kindAlter: smallint(),
    kinderAnzahl: smallint(),
    sprache: sprache(),
    notizKunde: text(),
    // For the performer: "dog in the yard", "door code 1234".
    notizIntern: text(),
    kundeId: integer().references(() => kunden.id, { onDelete: "restrict" }),
    positionen: jsonb()
      .$type<PreisPosition[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    summe: geld(),
    anzahlung: geld(),
    zahlungsart: zahlungAdapter(),
    haltenBis: zeitpunkt(),
    // sha256 of the link the customer gets to see and cancel the booking.
    zugriffHash: varchar({ length: 64 }).unique(),
    storniertAm: zeitpunkt(),
    stornoGebuehr: geld(),
    stornoGrund: varchar({ length: 300 }),
    ...timestamps,
  },
  (t) => [
    index("buchungen_beginn_idx").on(t.beginn),
    index("buchungen_halten_idx")
      .on(t.haltenBis)
      .where(sql`${t.status} = 'reserviert'`),
    check(
      "buchungen_fenster",
      sql`(${t.fensterVon} IS NULL AND ${t.fensterBis} IS NULL) OR ${t.fensterBis} > ${t.fensterVon}`,
    ),
  ],
);

export const buchungExtras = buchungSchema.table(
  "buchung_extras",
  {
    buchungId: integer()
      .notNull()
      .references(() => buchungen.id, { onDelete: "cascade" }),
    extraId: integer()
      .notNull()
      .references(() => extras.id, { onDelete: "restrict" }),
    preis: geld(),
    dauerDeltaMin: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.buchungId, t.extraId] })],
);

// Every stretch of time a performer is taken: a visit (with travel and setup) or time off.
// One table, so one exclusion constraint (migration 0000) refuses any overlap of active rows.
export const belegungen = buchungSchema.table(
  "belegungen",
  {
    id: serial().primaryKey(),
    darstellerId: integer()
      .notNull()
      .references(() => darsteller.id, { onDelete: "restrict" }),
    art: belegungArt().notNull(),
    buchungId: integer().references(() => buchungen.id, { onDelete: "cascade" }),
    figurId: integer().references(() => figuren.id, { onDelete: "restrict" }),
    von: zeitpunkt().notNull(),
    bis: zeitpunkt().notNull(),
    aktiv: boolean().notNull().default(true),
    grund: varchar({ length: 300 }),
    ...timestamps,
  },
  (t) => [
    index("belegungen_darsteller_idx")
      .on(t.darstellerId, t.von)
      .where(sql`${t.aktiv}`),
    index("belegungen_buchung_idx").on(t.buchungId),
    check("belegungen_zeit", sql`${t.bis} > ${t.von}`),
    check("belegungen_art", sql`(${t.art} = 'einsatz') = (${t.buchungId} IS NOT NULL)`),
  ],
);

export const zahlungen = buchungSchema.table(
  "zahlungen",
  {
    id: serial().primaryKey(),
    buchungId: integer()
      .notNull()
      .references(() => buchungen.id, { onDelete: "restrict" }),
    adapter: zahlungAdapter().notNull(),
    art: zahlungArt().notNull(),
    betrag: geld().notNull(),
    status: zahlungStatus().notNull().default("offen"),
    externId: varchar({ length: 200 }),
    payload: jsonb(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("zahlungen_extern_idx").on(t.adapter, t.externId),
    index("zahlungen_buchung_idx").on(t.buchungId),
  ],
);

// A webhook the provider sends twice is handled once.
export const webhookEreignisse = buchungSchema.table(
  "webhook_ereignisse",
  {
    adapter: zahlungAdapter().notNull(),
    ereignisId: varchar({ length: 200 }).notNull(),
    empfangenAm: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.adapter, t.ereignisId] })],
);

// Reviews with name and city; shown on the home page and the city's landing page.
export const bewertungen = buchungSchema.table(
  "bewertungen",
  {
    id: serial().primaryKey(),
    name: varchar({ length: 100 }).notNull(),
    stadtId: integer().references(() => staedte.id, { onDelete: "set null" }),
    text: text().notNull(),
    sterne: smallint().notNull().default(5),
    datum: date({ mode: "string" }),
    veroeffentlicht: boolean().notNull().default(false),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [check("bewertungen_sterne", sql`${t.sterne} BETWEEN 1 AND 5`)],
);
