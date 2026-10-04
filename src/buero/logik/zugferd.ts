// ZUGFeRD 2.3 / Factur-X 1.0, profile EN 16931 (CII D16B): the XML embedded in the invoice PDF
// (pdf/zugferd.ts). The same invoice as the XRechnung (xrechnung.ts, UBL) — the same data, the
// same totals from geld.ts, the same rules: §19 Kleinunternehmer as category E, a Storno naming
// its invoice, BR-CO-26 for a seller with only a Steuernummer, the Leitweg-ID as BuyerReference,
// invoices on account deducted as prepaid (BT-113). Ported from port/src/lib/invoicing/einvoice/
// cii.ts, which carries boden's KoSIT measurements.
//
// CII is a sequence schema: element order is part of the contract (TradeTax: CalculatedAmount →
// TypeCode → ExemptionReason → BasisAmount → CategoryCode → RateApplicablePercent; settlement:
// PaymentMeans → TradeTax → BillingSpecifiedPeriod → PaymentTerms → Summation →
// InvoiceReferencedDocument; SellerTradeParty: ID → Name → Contact → Address → URI → TaxRegistration).
import { positionNetto, rechnungsSummen } from "./geld";
import {
  KLEINUNTERNEHMER_BEFREIUNG,
  KLEINUNTERNEHMER_HINWEIS,
  type XRechnungDaten,
} from "./xrechnung";

export const FACTUR_X_DATEINAME = "factur-x.xml";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const geld = (cent: number) => (cent / 100).toFixed(2);
const tag = (iso: string) => iso.replace(/-/g, "");
const zeitpunkt = (element: string, iso: string) =>
  `<ram:${element}><udt:DateTimeString format="102">${tag(iso)}</udt:DateTimeString></ram:${element}>`;

const adresse = (a: {
  plz: string | null;
  strasse: string | null;
  ort: string | null;
  land: string;
}) =>
  `<ram:PostalTradeAddress><ram:PostcodeCode>${esc(a.plz ?? "")}</ram:PostcodeCode><ram:LineOne>${esc(a.strasse ?? "")}</ram:LineOne><ram:CityName>${esc(a.ort ?? "")}</ram:CityName><ram:CountryID>${esc(a.land)}</ram:CountryID></ram:PostalTradeAddress>`;

const mail = (wert: string | null | undefined) =>
  wert?.trim()
    ? `\n        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">${esc(wert.trim())}</ram:URIID></ram:URIUniversalCommunication>`
    : "";

const steuerNr = (id: string | null | undefined, schema: "FC" | "VA") =>
  id?.trim()
    ? `\n        <ram:SpecifiedTaxRegistration><ram:ID schemeID="${schema}">${esc(id.trim())}</ram:ID></ram:SpecifiedTaxRegistration>`
    : "";

/** The CII XML of an issued invoice; throws for one without lines, like the XRechnung. */
export function zugferdXml(d: XRechnungDaten): string {
  if (d.positionen.length === 0)
    throw new Error("Eine E-Rechnung braucht mindestens eine Position.");
  const v = d.verkaeufer;
  const e = d.empfaenger;
  const summen = rechnungsSummen(d.positionen, d.kleinunternehmer);
  const kategorie = d.kleinunternehmer ? "E" : "S";
  const vorausbezahlt = d.vorausbezahlt ?? 0;

  // CII has room for one referenced invoice: the Storno's; the invoices on account a final
  // invoice deducts are named in a note (UBL lists each one in BG-3).
  const hinweise = [
    ...(d.kleinunternehmer ? [KLEINUNTERNEHMER_HINWEIS] : []),
    ...(d.hinweise ?? []),
    ...(d.vorherige?.length
      ? [`Berücksichtigte Abschlagsrechnungen: ${d.vorherige.join(", ")}.`]
      : []),
  ]
    .filter(Boolean)
    .map(
      (text) =>
        `\n    <ram:IncludedNote><ram:Content>${esc(text)}</ram:Content></ram:IncludedNote>`,
    )
    .join("");

  const zeilen = d.positionen
    .map(
      (p, i) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>${i + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>${esc(p.bezeichnung)}</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice><ram:ChargeAmount>${p.einzelpreis.toFixed(2)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="${p.einheit}">${p.menge.toFixed(4)}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>${kategorie}</ram:CategoryCode><ram:RateApplicablePercent>${(d.kleinunternehmer ? 0 : p.ustSatz).toFixed(2)}</ram:RateApplicablePercent></ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${geld(positionNetto(p))}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`,
    )
    .join("");

  // BR-CO-26: without USt-IdNr the Steuernummer goes out once more as the seller's ID (BT-29),
  // as in the XRechnung.
  const verkaeuferId =
    !v.ustId && v.steuernummer ? `\n        <ram:ID>${esc(v.steuernummer)}</ram:ID>` : "";
  const kontakt =
    v.telefon || v.email
      ? `
        <ram:DefinedTradeContact>
          <ram:PersonName>${esc(v.inhaber || v.name)}</ram:PersonName>${
            v.telefon
              ? `\n          <ram:TelephoneUniversalCommunication><ram:CompleteNumber>${esc(v.telefon)}</ram:CompleteNumber></ram:TelephoneUniversalCommunication>`
              : ""
          }${
            v.email
              ? `\n          <ram:EmailURIUniversalCommunication><ram:URIID>${esc(v.email)}</ram:URIID></ram:EmailURIUniversalCommunication>`
              : ""
          }
        </ram:DefinedTradeContact>`
      : "";

  const von = d.leistungVon ?? d.leistungBis;
  const bis = d.leistungBis ?? d.leistungVon;
  const lieferung =
    von && (!bis || von === bis)
      ? `<ram:ApplicableHeaderTradeDelivery><ram:ActualDeliverySupplyChainEvent>${zeitpunkt("OccurrenceDateTime", von)}</ram:ActualDeliverySupplyChainEvent></ram:ApplicableHeaderTradeDelivery>`
      : "<ram:ApplicableHeaderTradeDelivery/>";
  const zeitraum =
    von && bis && von !== bis
      ? `\n      <ram:BillingSpecifiedPeriod>${zeitpunkt("StartDateTime", von)}${zeitpunkt("EndDateTime", bis)}</ram:BillingSpecifiedPeriod>`
      : "";

  const steuern = summen.gruppen
    .map(
      (g) => `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${geld(g.steuer)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>${
          d.kleinunternehmer
            ? `\n        <ram:ExemptionReason>${esc(KLEINUNTERNEHMER_BEFREIUNG)}</ram:ExemptionReason>`
            : ""
        }
        <ram:BasisAmount>${geld(g.netto)}</ram:BasisAmount>
        <ram:CategoryCode>${kategorie}</ram:CategoryCode>
        <ram:RateApplicablePercent>${g.satz.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`,
    )
    .join("");

  const faellig = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC" }).format(
    new Date(`${d.faelligAm}T00:00:00Z`),
  );
  const korrigiert = d.korrigiert
    ? `\n      <ram:InvoiceReferencedDocument><ram:IssuerAssignedID>${esc(d.korrigiert)}</ram:IssuerAssignedID></ram:InvoiceReferencedDocument>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(d.nummer)}</ram:ID>
    <ram:TypeCode>${d.typ}</ram:TypeCode>
    ${zeitpunkt("IssueDateTime", d.ausgestelltAm)}${hinweise}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${zeilen}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>${esc(e.leitwegId || d.nummer)}</ram:BuyerReference>
      <ram:SellerTradeParty>${verkaeuferId}
        <ram:Name>${esc(v.name)}</ram:Name>${kontakt}
        ${adresse({ ...v, land: "DE" })}${mail(v.email)}${steuerNr(v.steuernummer, "FC")}${steuerNr(v.ustId, "VA")}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(e.name)}</ram:Name>
        ${adresse(e)}${mail(e.email)}${steuerNr(e.ustId, "VA")}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    ${lieferung}
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${esc(v.iban ?? "")}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount>${
          v.bic
            ? `\n        <ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>${esc(v.bic)}</ram:BICID></ram:PayeeSpecifiedCreditorFinancialInstitution>`
            : ""
        }
      </ram:SpecifiedTradeSettlementPaymentMeans>${steuern}${zeitraum}
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>Zahlbar bis ${faellig} ohne Abzug.</ram:Description>
        ${zeitpunkt("DueDateDateTime", d.faelligAm)}
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${geld(summen.netto)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${geld(summen.netto)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${geld(summen.steuer)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${geld(summen.brutto)}</ram:GrandTotalAmount>${
          vorausbezahlt
            ? `\n        <ram:TotalPrepaidAmount>${geld(vorausbezahlt)}</ram:TotalPrepaidAmount>`
            : ""
        }
        <ram:DuePayableAmount>${geld(summen.brutto - vorausbezahlt)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>${korrigiert}
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}
