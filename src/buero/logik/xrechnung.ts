// XRechnung 3.0 as UBL 2.1 (EN 16931): the E-Rechnung a German business customer or authority
// receives. Ported from boden/lib/services/xrechnung.ts (KoSIT-validated there) and reduced to a
// software business: the standard rates (S, 19 and 7 %), §19 Kleinunternehmer (E), Storno,
// invoices on account (326) and the final invoice that deducts them (BT-113). No reverse charge,
// no allowances. Totals come from geld.ts, the same numbers the invoice stores.
// UBL is a sequence: element order below is part of the contract (the XSD stage rejects others).
import { positionNetto, rechnungsSummen } from "./geld";
import type { Einheit, Empfaenger, Firma } from "./typen";

export const XRECHNUNG_CUSTOMIZATION =
  "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";
const PROFILE = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

export const KLEINUNTERNEHMER_HINWEIS = "Gemäß §19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.";
export const KLEINUNTERNEHMER_BEFREIUNG = "Umsatzsteuerbefreiung gemäß §19 Abs. 1 UStG";

export type XRechnungDaten = {
  nummer: string;
  /** 380 = Rechnung, 326 = Teil-/Abschlagsrechnung, 384 = Rechnungskorrektur (Storno). */
  typ: "380" | "326" | "384";
  ausgestelltAm: string;
  faelligAm: string;
  leistungVon: string | null;
  leistungBis: string | null;
  verkaeufer: Firma;
  empfaenger: Empfaenger;
  positionen: {
    bezeichnung: string;
    menge: number;
    einheit: Einheit;
    einzelpreis: number;
    ustSatz: number;
  }[];
  kleinunternehmer: boolean;
  /** BG-3: the invoice a Storno corrects. */
  korrigiert?: string | null;
  /** BG-3 as well: the invoices on account a final invoice settles. */
  vorherige?: string[];
  /** BT-113: what those invoices on account came to (gross, cents); deducted from the amount due. */
  vorausbezahlt?: number;
  hinweise?: string[];
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const geld = (cent: number) => (cent / 100).toFixed(2);

export function xrechnungXml(d: XRechnungDaten): string {
  if (d.positionen.length === 0)
    throw new Error("Eine E-Rechnung braucht mindestens eine Position.");
  const v = d.verkaeufer;
  const e = d.empfaenger;
  const summen = rechnungsSummen(d.positionen, d.kleinunternehmer);
  const cur = 'currencyID="EUR"';

  const hinweise = [
    ...(d.kleinunternehmer ? [KLEINUNTERNEHMER_HINWEIS] : []),
    ...(d.hinweise ?? []),
  ]
    .filter(Boolean)
    .map((n) => `\n  <cbc:Note>${esc(n)}</cbc:Note>`)
    .join("");

  // BT-72 or BG-14: one date or a period (boden einvoice-service-date.ts).
  const von = d.leistungVon ?? d.leistungBis;
  const bis = d.leistungBis ?? d.leistungVon;
  const zeitraum =
    von && bis && von !== bis
      ? `\n  <cac:InvoicePeriod>\n    <cbc:StartDate>${von}</cbc:StartDate>\n    <cbc:EndDate>${bis}</cbc:EndDate>\n  </cac:InvoicePeriod>`
      : "";
  const lieferung =
    von && (!bis || von === bis)
      ? `\n  <cac:Delivery>\n    <cbc:ActualDeliveryDate>${von}</cbc:ActualDeliveryDate>\n  </cac:Delivery>`
      : "";
  const korrektur = [...(d.korrigiert ? [d.korrigiert] : []), ...(d.vorherige ?? [])]
    .map(
      (nr) =>
        `\n  <cac:BillingReference>\n    <cac:InvoiceDocumentReference><cbc:ID>${esc(nr)}</cbc:ID></cac:InvoiceDocumentReference>\n  </cac:BillingReference>`,
    )
    .join("");
  const vorausbezahlt = d.vorausbezahlt ?? 0;

  // BR-DE-15: BT-10 always; the Leitweg-ID for authorities, else the invoice number.
  const referenz = e.leitwegId || d.nummer;
  const kaeuferAdresse = e.leitwegId
    ? `<cbc:EndpointID schemeID="0204">${esc(e.leitwegId)}</cbc:EndpointID>`
    : `<cbc:EndpointID schemeID="EM">${esc(e.email ?? "")}</cbc:EndpointID>`;

  const steuerschema = [
    v.steuernummer
      ? `\n      <cac:PartyTaxScheme>\n        <cbc:CompanyID>${esc(v.steuernummer)}</cbc:CompanyID>\n        <cac:TaxScheme><cbc:ID>FC</cbc:ID></cac:TaxScheme>\n      </cac:PartyTaxScheme>`
      : "",
    v.ustId
      ? `\n      <cac:PartyTaxScheme>\n        <cbc:CompanyID>${esc(v.ustId)}</cbc:CompanyID>\n        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n      </cac:PartyTaxScheme>`
      : "",
  ].join("");

  const kategorie = d.kleinunternehmer ? "E" : "S";
  const gruppen = summen.gruppen
    .map(
      (g) => `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount ${cur}>${geld(g.netto)}</cbc:TaxableAmount>
      <cbc:TaxAmount ${cur}>${geld(g.steuer)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${kategorie}</cbc:ID>
        <cbc:Percent>${g.satz.toFixed(2)}</cbc:Percent>${
          d.kleinunternehmer
            ? `\n        <cbc:TaxExemptionReason>${KLEINUNTERNEHMER_BEFREIUNG}</cbc:TaxExemptionReason>`
            : ""
        }
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`,
    )
    .join("");

  const zeilen = d.positionen
    .map((p, i) => {
      const satz = d.kleinunternehmer ? 0 : p.ustSatz;
      return `
  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${p.einheit}">${p.menge.toFixed(4)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount ${cur}>${geld(positionNetto(p))}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${esc(p.bezeichnung)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${kategorie}</cbc:ID>
        <cbc:Percent>${satz.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount ${cur}>${p.einzelpreis.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    })
    .join("");

  const faellig = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC" }).format(
    new Date(`${d.faelligAm}T00:00:00Z`),
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>${XRECHNUNG_CUSTOMIZATION}</cbc:CustomizationID>
  <cbc:ProfileID>${PROFILE}</cbc:ProfileID>
  <cbc:ID>${esc(d.nummer)}</cbc:ID>
  <cbc:IssueDate>${d.ausgestelltAm}</cbc:IssueDate>
  <cbc:DueDate>${d.faelligAm}</cbc:DueDate>
  <cbc:InvoiceTypeCode>${d.typ}</cbc:InvoiceTypeCode>${hinweise}
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>${esc(referenz)}</cbc:BuyerReference>${zeitraum}${korrektur}
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="EM">${esc(v.email ?? "")}</cbc:EndpointID>${
        // BR-CO-26: the seller must be identified by BT-29, BT-30 or BT-31. The Steuernummer (BT-32,
        // scheme FC) does not count, so a firm without USt-IdNr — every Kleinunternehmer, most sole
        // traders — carries it once more as BT-29 (boden einvoice-seller-identity.ts, KoSIT-measured).
        !v.ustId && v.steuernummer
          ? `\n      <cac:PartyIdentification><cbc:ID>${esc(v.steuernummer)}</cbc:ID></cac:PartyIdentification>`
          : ""
      }
      <cac:PartyName><cbc:Name>${esc(v.name)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(v.strasse ?? "")}</cbc:StreetName>
        <cbc:CityName>${esc(v.ort ?? "")}</cbc:CityName>
        <cbc:PostalZone>${esc(v.plz ?? "")}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>${steuerschema}
      <cac:PartyLegalEntity><cbc:RegistrationName>${esc(v.name)}</cbc:RegistrationName></cac:PartyLegalEntity>
      <cac:Contact>
        <cbc:Name>${esc(v.inhaber || v.name)}</cbc:Name>
        <cbc:Telephone>${esc(v.telefon ?? "")}</cbc:Telephone>
        <cbc:ElectronicMail>${esc(v.email ?? "")}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${kaeuferAdresse}
      <cac:PartyName><cbc:Name>${esc(e.name)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(e.strasse ?? "")}</cbc:StreetName>
        <cbc:CityName>${esc(e.ort ?? "")}</cbc:CityName>
        <cbc:PostalZone>${esc(e.plz ?? "")}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${esc(e.land)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>${
        e.ustId
          ? `\n      <cac:PartyTaxScheme>\n        <cbc:CompanyID>${esc(e.ustId)}</cbc:CompanyID>\n        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n      </cac:PartyTaxScheme>`
          : ""
      }
      <cac:PartyLegalEntity><cbc:RegistrationName>${esc(e.name)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>${lieferung}
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${esc(v.iban ?? "")}</cbc:ID>${
        v.bic
          ? `\n      <cac:FinancialInstitutionBranch><cbc:ID>${esc(v.bic)}</cbc:ID></cac:FinancialInstitutionBranch>`
          : ""
      }
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>
  <cac:PaymentTerms>
    <cbc:Note>Zahlbar bis ${faellig} ohne Abzug.</cbc:Note>
  </cac:PaymentTerms>
  <cac:TaxTotal>
    <cbc:TaxAmount ${cur}>${geld(summen.steuer)}</cbc:TaxAmount>${gruppen}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount ${cur}>${geld(summen.netto)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount ${cur}>${geld(summen.netto)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount ${cur}>${geld(summen.brutto)}</cbc:TaxInclusiveAmount>${vorausbezahlt ? `\n    <cbc:PrepaidAmount ${cur}>${geld(vorausbezahlt)}</cbc:PrepaidAmount>` : ""}
    <cbc:PayableAmount ${cur}>${geld(summen.brutto - vorausbezahlt)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${zeilen}
</ubl:Invoice>
`;
}
