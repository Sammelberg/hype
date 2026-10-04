// Invoices: drafts are edited freely; issuing gives the number, freezes recipient, issuer and
// totals, and from then on only payment and Storno move them (the trigger in migration 0002
// enforces what this module does). Corrections are Stornos: a second, negative invoice.
import { createHash } from "node:crypto";

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import { db, type Db, type Tx } from "../../cms/db/client";
import { auftraege, kunden, rechnungPdfs, rechnungen, vertraege } from "../db/schema";
import { datumDe, heute, jahr, kannWechseln, tagePlus } from "../logik/ablauf";
import { typCode } from "../logik/abrechnung";
import { betragAusCent, centAusBetrag, rechnungsSummen } from "../logik/geld";
import { type Mangel, pruefeRechnung } from "../logik/pflichtangaben";
import { type Abschlag, type Position, type RechnungInput, RechnungSchema } from "../logik/typen";
import { type DokumentDaten } from "../logik/blatt";
import { type XRechnungDaten, xrechnungXml } from "../logik/xrechnung";
import { zugferdXml } from "../logik/zugferd";
import { BueroError, naechsteNummer } from "./basis";
import { getFirma } from "./firma";
import { erfasseZahlung, forderungVon, offenVon } from "./forderungen";
import { empfaengerVon, kundenName } from "./kunden";

export type Rechnung = typeof rechnungen.$inferSelect;

const spalten = (r: RechnungInput) => ({
  art: r.art,
  kundeId: r.kundeId,
  auftragId: r.auftragId,
  vertragId: r.vertragId,
  leistungVon: r.leistungVon,
  leistungBis: r.leistungBis,
  zahlungszielTage: r.zahlungszielTage,
  einleitung: r.einleitung,
  schlusstext: r.schlusstext,
  positionen: r.positionen,
});

export async function listRechnungen() {
  const rows = await db
    .select({ rechnung: rechnungen, kunde: kunden })
    .from(rechnungen)
    .innerJoin(kunden, eq(kunden.id, rechnungen.kundeId))
    .orderBy(desc(rechnungen.createdAt));
  return rows.map((r) => ({ ...r.rechnung, kundeName: kundenName(r.kunde) }));
}

export async function getRechnung(id: number, client: Db | Tx = db) {
  const [row] = await client
    .select({ rechnung: rechnungen, kunde: kunden })
    .from(rechnungen)
    .innerJoin(kunden, eq(kunden.id, rechnungen.kundeId))
    .where(eq(rechnungen.id, id))
    .limit(1);
  if (!row) return null;
  const r = row.rechnung;
  const [auftrag, vertrag, korrigiert, storno] = await Promise.all([
    r.auftragId
      ? client
          .select()
          .from(auftraege)
          .where(eq(auftraege.id, r.auftragId))
          .then((x) => x[0] ?? null)
      : null,
    r.vertragId
      ? client
          .select()
          .from(vertraege)
          .where(eq(vertraege.id, r.vertragId))
          .then((x) => x[0] ?? null)
      : null,
    r.korrigiertId
      ? client
          .select()
          .from(rechnungen)
          .where(eq(rechnungen.id, r.korrigiertId))
          .then((x) => x[0] ?? null)
      : null,
    client
      .select()
      .from(rechnungen)
      .where(eq(rechnungen.korrigiertId, id))
      .then((x) => x[0] ?? null),
  ]);
  return { rechnung: r, kunde: row.kunde, auftrag, vertrag, korrigiert, storno };
}

export async function createRechnung(raw: RechnungInput, client: Db | Tx = db) {
  const input = RechnungSchema.parse(raw);
  const [row] = await client
    .insert(rechnungen)
    .values(spalten(input))
    .returning({ id: rechnungen.id });
  return row!.id;
}

export async function saveRechnung(id: number, raw: RechnungInput) {
  const input = RechnungSchema.parse(raw);
  const [row] = await db
    .update(rechnungen)
    .set({ ...spalten(input), updatedAt: new Date() })
    .where(and(eq(rechnungen.id, id), eq(rechnungen.status, "entwurf")))
    .returning({ id: rechnungen.id });
  if (!row)
    throw new BueroError(
      "Nur ein Entwurf lässt sich ändern; gestellte Rechnungen korrigiert ein Storno.",
    );
}

export async function deleteRechnung(id: number) {
  const [row] = await db
    .delete(rechnungen)
    .where(and(eq(rechnungen.id, id), eq(rechnungen.status, "entwurf")))
    .returning({ id: rechnungen.id });
  if (!row)
    throw new BueroError("Nur Entwürfe werden gelöscht; eine gestellte Rechnung bleibt (GoBD).");
}

const summenSpalten = (positionen: Position[], kleinunternehmer: boolean) => {
  const s = rechnungsSummen(positionen, kleinunternehmer);
  return {
    summeNetto: betragAusCent(s.netto),
    summeSteuer: betragAusCent(s.steuer),
    summeBrutto: betragAusCent(s.brutto),
  };
};

/** What is missing before the draft can be issued, measured on today's customer and issuer. */
export async function pruefeEntwurf(
  r: Rechnung,
): Promise<{ stellen: Mangel[]; xrechnung: Mangel[] }> {
  const [{ firma }, [kunde]] = await Promise.all([
    getFirma(),
    db.select().from(kunden).where(eq(kunden.id, r.kundeId)),
  ]);
  return pruefeRechnung({
    firma,
    empfaenger: kunde ? empfaengerVon(kunde) : null,
    positionen: r.positionen,
    leistungVon: r.leistungVon,
    leistungBis: r.leistungBis,
  });
}

// Issuing: the next number of this year, today's date, the parties as they are today, the totals.
export async function stelleRechnung(id: number, client: Db | Tx = db) {
  const { firma } = await getFirma(client);
  return client.transaction(async (tx) => {
    const [r] = await tx.select().from(rechnungen).where(eq(rechnungen.id, id)).for("update");
    if (!r) throw new BueroError("Die Rechnung gibt es nicht mehr.");
    if (!kannWechseln("rechnung", r.status, "gestellt"))
      throw new BueroError("Diese Rechnung ist schon gestellt.");
    const [kunde] = await tx.select().from(kunden).where(eq(kunden.id, r.kundeId));
    const empfaenger = kunde ? empfaengerVon(kunde) : null;
    const { stellen } = pruefeRechnung({
      firma,
      empfaenger,
      positionen: r.positionen,
      leistungVon: r.leistungVon,
      leistungBis: r.leistungBis,
    });
    if (stellen.length > 0)
      throw new BueroError(`Es fehlt noch: ${stellen.map((m) => m.text).join(", ")}.`);
    if ((r.art === "schluss" || r.art === "abschlag") && !r.auftragId)
      throw new BueroError(
        "Abschlags- und Schlussrechnungen gehören zu einem Auftrag. Wählen Sie ihn aus.",
        "auftragId",
      );
    const abschlaege = r.art === "schluss" ? await abschlaegeZu(tx, r.auftragId!, r.id) : null;
    if (
      abschlaege &&
      rechnungsSummen(r.positionen, firma.kleinunternehmer).brutto <
        abschlaege.reduce((sum, x) => sum + centAusBetrag(x.brutto), 0)
    )
      throw new BueroError(
        "Die Abschlagsrechnungen zum Auftrag übersteigen die Schlussrechnung. Die Schlussrechnung führt die ganze Leistung auf; prüfen Sie die Positionen.",
      );
    const tag = heute();
    const nummer = await naechsteNummer(tx, "RE", jahr(tag));
    await tx
      .update(rechnungen)
      .set({
        status: "gestellt",
        nummer,
        ausgestelltAm: tag,
        faelligAm: tagePlus(tag, r.zahlungszielTage),
        empfaenger,
        verkaeufer: firma,
        kleinunternehmer: firma.kleinunternehmer,
        ...summenSpalten(r.positionen, firma.kleinunternehmer),
        abschlaege,
        updatedAt: new Date(),
      })
      .where(eq(rechnungen.id, id));
    // An accepted order is billed now — by its final or only invoice, not by one on account.
    if (r.auftragId && r.art !== "abschlag")
      await tx
        .update(auftraege)
        .set({ status: "abgerechnet", updatedAt: new Date() })
        .where(and(eq(auftraege.id, r.auftragId), eq(auftraege.status, "abgenommen")));
    return nummer;
  });
}

/** Paid in full on `am`: what is still open is recorded as one payment (forderungen.ts). */
export async function markiereBezahlt(id: number, am: string, client: Db | Tx = db) {
  const [r] = await client.select().from(rechnungen).where(eq(rechnungen.id, id));
  if (!r || !kannWechseln("rechnung", r.status, "bezahlt"))
    throw new BueroError("Nur eine gestellte Rechnung kann als bezahlt gelten.");
  const { zahlungen } = await forderungVon(id, client);
  const offen = offenVon(r, zahlungen);
  await erfasseZahlung(
    { rechnungId: id, betrag: offen / 100, am, notiz: zahlungen.length ? "Restbetrag" : null },
    client,
  );
}

/** A final invoice's deductions as the document shows them (gross, cents). */
export const abzuegeVon = (r: Rechnung) => {
  // A Storno of a final invoice takes its deductions back: the same amounts, the other sign.
  const vorzeichen = r.typ === "storno" ? -1 : 1;
  return (r.abschlaege ?? []).map((a) => ({
    nummer: a.nummer,
    brutto: vorzeichen * centAusBetrag(a.brutto),
    netto: a.gruppen ? vorzeichen * a.gruppen.reduce((s, g) => s + g.netto, 0) : null,
    steuer: a.gruppen ? vorzeichen * a.gruppen.reduce((s, g) => s + g.steuer, 0) : null,
  }));
};

/** For the editor: per order, its invoices on account issued so far (gross, cents). */
export async function abschlaegeJeAuftrag() {
  const rows = await db
    .select()
    .from(rechnungen)
    .where(
      and(
        eq(rechnungen.art, "abschlag"),
        eq(rechnungen.typ, "rechnung"),
        inArray(rechnungen.status, ["gestellt", "bezahlt"]),
      ),
    )
    .orderBy(asc(rechnungen.ausgestelltAm), asc(rechnungen.id));
  const je: Record<number, { nummer: string; brutto: number; netto: number; steuer: number }[]> =
    {};
  for (const r of rows) {
    if (!r.auftragId) continue;
    (je[r.auftragId] ??= []).push({
      nummer: r.nummer!,
      brutto: centAusBetrag(r.summeBrutto),
      netto: centAusBetrag(r.summeNetto),
      steuer: centAusBetrag(r.summeSteuer),
    });
  }
  return je;
}

/**
 * The invoices on account of an order a final invoice deducts: issued or paid, not cancelled,
 * oldest first. Frozen into the final invoice when it is issued.
 */
export async function abschlaegeZu(
  client: Db | Tx,
  auftragId: number,
  ohne?: number,
): Promise<Abschlag[]> {
  const rows = await client
    .select()
    .from(rechnungen)
    .where(
      and(
        eq(rechnungen.auftragId, auftragId),
        eq(rechnungen.art, "abschlag"),
        eq(rechnungen.typ, "rechnung"),
        inArray(rechnungen.status, ["gestellt", "bezahlt"]),
      ),
    )
    .orderBy(asc(rechnungen.ausgestelltAm), asc(rechnungen.id));
  return rows
    .filter((x) => x.id !== ohne)
    .map((x) => ({
      id: x.id,
      nummer: x.nummer!,
      brutto: x.summeBrutto!,
      gruppen: rechnungsSummen(x.positionen, x.kleinunternehmer ?? false).gruppen,
    }));
}

// A Storno is a second invoice with the same parties and negative quantities, issued today,
// that names the original (XRechnung type 384, BG-3). The original is marked cancelled.
export async function storniereRechnung(id: number, client: Db | Tx = db) {
  return client.transaction(async (tx) => {
    const [r] = await tx.select().from(rechnungen).where(eq(rechnungen.id, id)).for("update");
    if (!r || r.typ !== "rechnung" || !kannWechseln("rechnung", r.status, "storniert"))
      throw new BueroError("Nur eine gestellte oder bezahlte Rechnung kann storniert werden.");
    const tag = heute();
    const nummer = await naechsteNummer(tx, "RE", jahr(tag));
    const positionen = r.positionen.map((p) => ({ ...p, menge: -p.menge }));
    const [storno] = await tx
      .insert(rechnungen)
      .values({
        typ: "storno",
        // Stornos of invoices on account keep the kind, so a final invoice no longer counts them.
        art: r.art === "abo" ? "normal" : r.art,
        status: "gestellt",
        nummer,
        kundeId: r.kundeId,
        auftragId: r.auftragId,
        vertragId: r.vertragId,
        korrigiertId: r.id,
        leistungVon: r.leistungVon,
        leistungBis: r.leistungBis,
        zahlungszielTage: 0,
        einleitung: `Storno der Rechnung ${r.nummer} vom ${datumDe(r.ausgestelltAm!)}.`,
        positionen,
        empfaenger: r.empfaenger,
        verkaeufer: r.verkaeufer,
        kleinunternehmer: r.kleinunternehmer,
        // A final invoice's deductions go with its Storno, so the two cancel out exactly.
        abschlaege: r.abschlaege,
        ausgestelltAm: tag,
        faelligAm: tag,
        ...summenSpalten(positionen, r.kleinunternehmer ?? false),
      })
      .returning({ id: rechnungen.id });
    await tx
      .update(rechnungen)
      .set({ status: "storniert", updatedAt: new Date() })
      .where(eq(rechnungen.id, id));
    return storno!.id;
  });
}

/** The data every rendering of an issued invoice uses: the print view and the XRechnung. */
export function ausgabeDaten(r: Rechnung, korrigiertNummer: string | null): XRechnungDaten {
  if (r.status === "entwurf" || !r.nummer || !r.empfaenger || !r.verkaeufer)
    throw new BueroError("Erst eine gestellte Rechnung hat eine Ausgabe.");
  return {
    nummer: r.nummer,
    typ: typCode(r.typ, r.art),
    ausgestelltAm: r.ausgestelltAm!,
    faelligAm: r.faelligAm!,
    leistungVon: r.leistungVon,
    leistungBis: r.leistungBis,
    verkaeufer: r.verkaeufer,
    empfaenger: r.empfaenger,
    positionen: r.positionen,
    kleinunternehmer: r.kleinunternehmer ?? false,
    korrigiert: korrigiertNummer,
    vorherige: r.typ === "rechnung" ? (r.abschlaege ?? []).map((a) => a.nummer) : [],
    vorausbezahlt: abzuegeVon(r).reduce((sum, a) => sum + a.brutto, 0),
    hinweise: [r.einleitung, r.schlusstext].filter((x): x is string => Boolean(x)),
  };
}

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

// The XRechnung of an issued invoice. The first export is archived with its sha256 (write-once,
// migration 0006); every later one hands out that same file, after checking it is unchanged.
export async function xrechnungFuer(id: number, client: Db | Tx = db) {
  const found = await getRechnung(id, client);
  if (!found) throw new BueroError("Die Rechnung gibt es nicht mehr.");
  const { rechnung } = found;
  if (rechnung.archivXml !== null) {
    if (sha256(rechnung.archivXml) !== rechnung.archivSha256)
      throw new BueroError(
        `Die archivierte E-Rechnung zu ${rechnung.nummer} passt nicht mehr zu ihrer Prüfsumme. Sie wird nicht ausgegeben; bitte prüfen Sie, wer Zugriff auf die Datenbank hat.`,
      );
    return { nummer: rechnung.nummer!, xml: rechnung.archivXml };
  }
  const erzeugt = erzeugeXrechnung(found);
  // Only the first writer archives; a second export at the same moment gets the stored file.
  const [gespeichert] = await client
    .update(rechnungen)
    .set({ archivXml: erzeugt.xml, archivSha256: sha256(erzeugt.xml) })
    .where(and(eq(rechnungen.id, id), isNull(rechnungen.archivXml)))
    .returning({ xml: rechnungen.archivXml });
  if (gespeichert) return erzeugt;
  return xrechnungFuer(id, client);
}

function erzeugeXrechnung(found: NonNullable<Awaited<ReturnType<typeof getRechnung>>>) {
  const daten = ausgabeDaten(found.rechnung, found.korrigiert?.nummer ?? null);
  const { xrechnung } = pruefeRechnung({
    firma: daten.verkaeufer,
    empfaenger: daten.empfaenger,
    positionen: daten.positionen,
    leistungVon: daten.leistungVon,
    leistungBis: daten.leistungBis,
  });
  if (xrechnung.length > 0)
    throw new BueroError(
      `Für die E-Rechnung fehlt: ${xrechnung.map((m) => m.text).join(", ")}. Die gestellte Rechnung bleibt, wie sie ist; tragen Sie die Angaben ein und stornieren und stellen Sie sie neu, oder senden Sie die Druckfassung.`,
    );
  return { nummer: daten.nummer, xml: xrechnungXml(daten) };
}

type Gefunden = NonNullable<Awaited<ReturnType<typeof getRechnung>>>;

/** The sheet of an issued invoice: the print view, the invoice's page and the PDF read it. */
export function blattDaten(found: Gefunden): DokumentDaten {
  const r = found.rechnung;
  return {
    ...ausgabeDaten(r, found.korrigiert?.nummer ?? null),
    storno: r.typ === "storno",
    art: r.art,
    abzuege: abzuegeVon(r),
    korrigiert: found.korrigiert?.nummer ?? null,
    kundennummer: found.kunde.nummer,
    einleitung: r.einleitung,
    schlusstext: r.schlusstext,
  };
}

const sha256Bytes = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

// The PDF of an issued invoice. The first one is archived with its sha256 in `rechnung_pdfs`
// (write-once, migration 0016), so the file sent, downloaded or printed later is always this one.
// ZUGFeRD — the CII XML inside — when the XRechnung data are complete, else plain PDF/A-3b.
export async function pdfFuer(
  id: number,
  client: Db | Tx = db,
): Promise<{ nummer: string; pdf: Uint8Array; zugferd: boolean }> {
  const found = await getRechnung(id, client);
  if (!found) throw new BueroError("Die Rechnung gibt es nicht mehr.");
  const { rechnung } = found;
  if (rechnung.status === "entwurf" || !rechnung.nummer)
    throw new BueroError("Ein Entwurf hat noch kein PDF. Stellen Sie die Rechnung zuerst.");
  const archiv = await archiviertesPdf(id, rechnung.nummer, client);
  if (archiv) return archiv;

  const daten = ausgabeDaten(rechnung, found.korrigiert?.nummer ?? null);
  const { xrechnung } = pruefeRechnung({
    firma: daten.verkaeufer,
    empfaenger: daten.empfaenger,
    positionen: daten.positionen,
    leistungVon: daten.leistungVon,
    leistungBis: daten.leistungBis,
  });
  const xml = xrechnung.length === 0 ? zugferdXml(daten) : null;
  // Loaded on demand: react-pdf and its fonts are needed only here.
  const { rechnungsPdf } = await import("../pdf");
  const pdf = await rechnungsPdf(blattDaten(found), xml, new Date());
  // Only the first writer archives; a second render at the same moment gets the stored file.
  const [gespeichert] = await client
    .insert(rechnungPdfs)
    .values({
      rechnungId: id,
      pdf: Buffer.from(pdf),
      sha256: sha256Bytes(pdf),
      zugferd: xml !== null,
    })
    .onConflictDoNothing()
    .returning({ id: rechnungPdfs.rechnungId });
  if (gespeichert) return { nummer: rechnung.nummer, pdf, zugferd: xml !== null };
  const zuerst = await archiviertesPdf(id, rechnung.nummer, client);
  if (!zuerst) throw new BueroError("Das PDF konnte nicht archiviert werden.");
  return zuerst;
}

async function archiviertesPdf(id: number, nummer: string, client: Db | Tx) {
  const [row] = await client.select().from(rechnungPdfs).where(eq(rechnungPdfs.rechnungId, id));
  if (!row) return null;
  const pdf = new Uint8Array(row.pdf);
  if (sha256Bytes(pdf) !== row.sha256)
    throw new BueroError(
      `Das archivierte PDF zu ${nummer} passt nicht mehr zu seiner Prüfsumme. Es wird nicht ausgegeben; bitte prüfen Sie, wer Zugriff auf die Datenbank hat.`,
    );
  return { nummer, pdf, zugferd: row.zugferd };
}
