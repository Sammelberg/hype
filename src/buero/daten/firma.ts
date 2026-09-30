// The issuer of the invoices: one document. Until it is saved, the site's confirmed owner details
// fill it (CLAUDE.md → Project); tax number, bank and phone stay empty until the owner enters them
// — issuing an invoice checks them (logik/pflichtangaben.ts).
import { eq } from "drizzle-orm";

import { db, type Db, type Tx } from "../../cms/db/client";
import { getSiteSettings } from "../../cms/content/site-settings";
import { firma } from "../db/schema";
import { type Firma, FirmaSchema } from "../logik/typen";

const ID = 1;

async function vorgabe(): Promise<Firma> {
  const settings = await getSiteSettings();
  return {
    name: settings?.siteName || "Schwarzwald Systems",
    inhaber: "Oleksandr Zamula",
    strasse: "Merianhof 5",
    plz: "79104",
    ort: "Freiburg im Breisgau",
    steuernummer: null,
    ustId: null,
    kleinunternehmer: false,
    iban: null,
    bic: null,
    bank: null,
    telefon: null,
    email: settings?.contactEmail || null,
    zahlungszielTage: 14,
    fusszeile: null,
  };
}

export async function getFirma(
  client: Db | Tx = db,
): Promise<{ firma: Firma; gespeichert: boolean }> {
  const [row] = await client.select().from(firma).where(eq(firma.id, ID)).limit(1);
  if (!row) return { firma: await vorgabe(), gespeichert: false };
  const parsed = FirmaSchema.safeParse(row.data);
  return {
    firma: parsed.success ? parsed.data : { ...(await vorgabe()), ...row.data },
    gespeichert: true,
  };
}

export async function saveFirma(raw: Firma, client: Db | Tx = db) {
  const data = FirmaSchema.parse(raw);
  await client
    .insert(firma)
    .values({ id: ID, data })
    .onConflictDoUpdate({ target: firma.id, set: { data, updatedAt: new Date() } });
}
