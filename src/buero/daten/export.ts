// The invoices of a period as the tax adviser's files take them (logik/export.ts): every issued
// invoice and Storno by its issue date, with the frozen recipient and totals.
import { and, asc, eq, gte, lte, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "../../cms/db/client";
import { kunden, rechnungen } from "../db/schema";
import { RECHNUNGSARTEN } from "../logik/abrechnung";
import type { JournalRechnung } from "../logik/export";

const STATUS_DE = { gestellt: "offen", bezahlt: "bezahlt", storniert: "storniert", entwurf: "" };

export async function journal(von: string, bis: string): Promise<JournalRechnung[]> {
  const original = alias(rechnungen, "original");
  const rows = await db
    .select({ r: rechnungen, kunde: kunden, korrigiert: original.nummer })
    .from(rechnungen)
    .innerJoin(kunden, eq(kunden.id, rechnungen.kundeId))
    .leftJoin(original, eq(original.id, rechnungen.korrigiertId))
    .where(
      and(
        ne(rechnungen.status, "entwurf"),
        gte(rechnungen.ausgestelltAm, von),
        lte(rechnungen.ausgestelltAm, bis),
      ),
    )
    .orderBy(asc(rechnungen.ausgestelltAm), asc(rechnungen.nummer));
  return rows.map(({ r, kunde, korrigiert }) => ({
    nummer: r.nummer!,
    typ: r.typ,
    art: RECHNUNGSARTEN[r.art],
    ausgestelltAm: r.ausgestelltAm!,
    faelligAm: r.faelligAm!,
    kundeNummer: kunde.nummer,
    kundeName: r.empfaenger?.name ?? kunde.firma ?? kunde.name ?? "",
    positionen: r.positionen,
    kleinunternehmer: r.kleinunternehmer ?? false,
    status: STATUS_DE[r.status],
    bezahltAm: r.bezahltAm,
    korrigiert,
  }));
}
