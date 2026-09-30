// Money for invoices, in whole cents: lines are rounded half away from zero, VAT is computed once
// per rate group (EN 16931 BR-CO-15), never per line. Pure — the admin's live preview and the
// server compute the same numbers. Rounding as boden/lib/money/round.ts.

export type PositionBetrag = { menge: number; einzelpreis: number; ustSatz: number };
export type UstGruppe = { satz: number; netto: number; steuer: number };
export type Summen = { netto: number; gruppen: UstGruppe[]; steuer: number; brutto: number };

/** Half away from zero, so a Storno rounds like its original. */
export const rundeCent = (cent: number) =>
  Math.sign(cent) * Math.round(Math.abs(cent) + Number.EPSILON * Math.abs(cent) + 1e-9) + 0;

export const positionNetto = (p: Pick<PositionBetrag, "menge" | "einzelpreis">) =>
  rundeCent(p.menge * p.einzelpreis * 100);

export function rechnungsSummen(positionen: PositionBetrag[], kleinunternehmer: boolean): Summen {
  const gruppen = new Map<number, number>();
  for (const p of positionen) {
    const satz = kleinunternehmer ? 0 : p.ustSatz;
    gruppen.set(satz, (gruppen.get(satz) ?? 0) + positionNetto(p));
  }
  const liste = [...gruppen.entries()].map(([satz, netto]) => ({
    satz,
    netto,
    steuer: rundeCent((netto * satz) / 100),
  }));
  const netto = liste.reduce((s, g) => s + g.netto, 0);
  const steuer = liste.reduce((s, g) => s + g.steuer, 0);
  return { netto, gruppen: liste, steuer, brutto: netto + steuer };
}

const format = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

/** 150503 → „1.505,03 €“. */
export const euro = (cent: number) => format.format(cent / 100);

/** A numeric(12,2) column as Postgres returns it („1505.03“) → cents. */
export const centAusBetrag = (betrag: string | null | undefined) =>
  betrag ? rundeCent(Number(betrag) * 100) : 0;

/** Cents → the numeric(12,2) text Postgres stores. */
export const betragAusCent = (cent: number) => (cent / 100).toFixed(2);
