// `pnpm erechnung:proben` — writes one XRechnung per shape this office can issue into
// .e-rechnung-proben/ (gitignored), for `pnpm erechnung:pruefen` (Mustang) or any other validator.
// The shapes mirror the KoSIT test: two VAT rates, a seller with only a Steuernummer (BR-CO-26),
// a Kleinunternehmer, a Storno, an authority by Leitweg-ID.
import { mkdirSync, writeFileSync } from "node:fs";

import { beispiel } from "../src/buero/logik/xrechnung.beispiel";
import { xrechnungXml, type XRechnungDaten } from "../src/buero/logik/xrechnung";

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
};

mkdirSync(ordner, { recursive: true });
for (const [name, daten] of Object.entries(proben))
  writeFileSync(`${ordner}/${name}.xml`, xrechnungXml(daten));
console.log(`${Object.keys(proben).length} Proben in ${ordner}/`);
