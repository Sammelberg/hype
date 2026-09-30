// What an invoice must carry. `stellen`: §14 Abs. 4 UStG — without it the invoice is not issued.
// `xrechnung`: what XRechnung 3.0 additionally requires (BR-DE rules) — without it the invoice can
// be issued and printed, but not exported as E-Rechnung. After boden/lib/compliance/
// rechnung-pflichtangaben.ts, reduced to what a software business invoices.
import type { Empfaenger, Firma } from "./typen";

export type Mangel = { text: string; norm: string };

type Pruefung = {
  firma: Firma;
  empfaenger: Empfaenger | null;
  positionen: { bezeichnung: string; menge: number; einzelpreis: number }[];
  leistungVon: string | null;
  leistungBis: string | null;
};

const leer = (v: string | null | undefined) => !v || !v.trim();

export function pruefeRechnung(r: Pruefung): { stellen: Mangel[]; xrechnung: Mangel[] } {
  const stellen: Mangel[] = [];
  const xrechnung: Mangel[] = [];
  const { firma, empfaenger } = r;

  if (leer(firma.name) || leer(firma.strasse) || leer(firma.plz) || leer(firma.ort))
    stellen.push({ text: "Name und Anschrift des Unternehmens", norm: "§14 Abs. 4 Nr. 1 UStG" });
  if (leer(firma.steuernummer) && leer(firma.ustId))
    stellen.push({
      text: "Steuernummer oder USt-IdNr des Unternehmens",
      norm: "§14 Abs. 4 Nr. 2 UStG",
    });
  if (!empfaenger || leer(empfaenger.name))
    stellen.push({ text: "Name des Kunden", norm: "§14 Abs. 4 Nr. 1 UStG" });
  if (!empfaenger || leer(empfaenger.strasse) || leer(empfaenger.plz) || leer(empfaenger.ort))
    stellen.push({ text: "Anschrift des Kunden", norm: "§14 Abs. 4 Nr. 1 UStG" });
  if (r.positionen.length === 0 || r.positionen.some((p) => leer(p.bezeichnung) || !p.menge))
    stellen.push({ text: "Menge und Art jeder Leistung", norm: "§14 Abs. 4 Nr. 5 UStG" });
  if (!r.leistungVon && !r.leistungBis)
    stellen.push({ text: "Zeitpunkt oder Zeitraum der Leistung", norm: "§14 Abs. 4 Nr. 6 UStG" });

  if (leer(firma.iban)) xrechnung.push({ text: "IBAN des Unternehmens", norm: "XRechnung BT-84" });
  if (leer(firma.telefon))
    xrechnung.push({ text: "Telefon des Unternehmens", norm: "XRechnung BR-DE-6" });
  if (leer(firma.email))
    xrechnung.push({ text: "E-Mail-Adresse des Unternehmens", norm: "XRechnung BR-DE-7" });
  if (!empfaenger || leer(empfaenger.email))
    xrechnung.push({ text: "E-Mail-Adresse des Kunden", norm: "XRechnung BT-49" });

  return { stellen, xrechnung };
}
