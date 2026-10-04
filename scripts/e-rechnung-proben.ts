// `pnpm erechnung:proben` — writes one XRechnung and one ZUGFeRD PDF per shape this office can
// issue into .e-rechnung-proben/ (gitignored), for `pnpm erechnung:pruefen` (Mustang) or any other
// validator. The shapes mirror the KoSIT test: two VAT rates, a seller with only a Steuernummer
// (BR-CO-26), a Kleinunternehmer, a Storno, an authority by Leitweg-ID, a final invoice.
import { mkdirSync, writeFileSync } from "node:fs";

import type { DokumentDaten } from "../src/buero/logik/blatt";
import { beispiel } from "../src/buero/logik/xrechnung.beispiel";
import { xrechnungXml, type XRechnungDaten } from "../src/buero/logik/xrechnung";
import { zugferdXml } from "../src/buero/logik/zugferd";
import { rechnungsPdf } from "../src/buero/pdf";

const ordner = ".e-rechnung-proben";
const ohneUstId = { ...beispiel.verkaeufer, ustId: null };
const proben: Record<string, XRechnungDaten> = {
  "zwei-steuersaetze": beispiel,
  "nur-steuernummer": { ...beispiel, verkaeufer: ohneUstId },
  kleinunternehmer: { ...beispiel, kleinunternehmer: true, verkaeufer: ohneUstId },
  storno: {
    ...beispiel,
    nummer: "RE-2026-0002",
    typ: "384",
    korrigiert: "RE-2026-0001",
    positionen: beispiel.positionen.map((p) => ({ ...p, menge: -p.menge })),
  },
  behoerde: {
    ...beispiel,
    leistungVon: "2026-09-15",
    leistungBis: null,
    empfaenger: { ...beispiel.empfaenger, leitwegId: "991-33333TEST-33" },
  },
  schluss: {
    ...beispiel,
    nummer: "RE-2026-0003",
    vorherige: ["RE-2026-0000"],
    vorausbezahlt: 50_000,
  },
};

const blatt = (d: XRechnungDaten): DokumentDaten => ({
  nummer: d.nummer,
  storno: d.typ === "384",
  korrigiert: d.korrigiert ?? null,
  ausgestelltAm: d.ausgestelltAm,
  faelligAm: d.faelligAm,
  leistungVon: d.leistungVon,
  leistungBis: d.leistungBis,
  verkaeufer: d.verkaeufer,
  empfaenger: d.empfaenger,
  kleinunternehmer: d.kleinunternehmer,
  einleitung: null,
  schlusstext: null,
  positionen: d.positionen,
  ...(d.vorausbezahlt
    ? { art: "schluss" as const, abzuege: [{ nummer: "RE-2026-0000", brutto: d.vorausbezahlt }] }
    : {}),
});

mkdirSync(ordner, { recursive: true });
for (const [name, daten] of Object.entries(proben)) {
  writeFileSync(`${ordner}/${name}.xml`, xrechnungXml(daten));
  const am = new Date(`${daten.ausgestelltAm}T09:00:00Z`);
  writeFileSync(`${ordner}/${name}.pdf`, await rechnungsPdf(blatt(daten), zugferdXml(daten), am));
}
console.log(`${Object.keys(proben).length * 2} Proben in ${ordner}/`);
