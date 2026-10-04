// Mollie (Amsterdam, EU): the hosted checkout takes the Anzahlung with PayPal, cards, Apple and
// Google Pay, Klarna or SEPA. Plain HTTPS against the v2 API, no SDK. Mollie receives the
// amount, a description with the booking number and the return address — no name, no e-mail,
// no address of the customer. Its webhook only says „look at payment tr_…“; the status is always
// fetched from the API.
import type { ZahlungsAdapter, ZahlungsStand } from "./adapter";

const API = "https://api.mollie.com/v2";

type Abruf = (url: string, init: RequestInit) => Promise<Response>;

const betrag = (cent: number) => ({ currency: "EUR", value: (cent / 100).toFixed(2) });

/** Mollie's payment statuses in ours; „authorized“ (Klarna) counts as paid for the deposit. */
export function standAusMollie(status: string): ZahlungsStand {
  switch (status) {
    case "paid":
    case "authorized":
      return "bezahlt";
    case "canceled":
    case "expired":
      return "abgebrochen";
    case "failed":
      return "fehlgeschlagen";
    default:
      return "offen";
  }
}

export function mollieAdapter(o: {
  apiKey: string;
  /** The site's public address („https://example.de“); the checkout returns there. */
  basis: string;
  abruf?: Abruf;
}): ZahlungsAdapter {
  const abruf: Abruf = o.abruf ?? ((url, init) => fetch(url, init));
  const rufe = async (pfad: string, init: RequestInit = {}) => {
    const antwort = await abruf(`${API}${pfad}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${o.apiKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await antwort.json().catch(() => ({}))) as Record<string, unknown>;
    if (!antwort.ok)
      throw new Error(`Mollie ${antwort.status}: ${String(json.detail ?? json.title ?? "Fehler")}`);
    return json;
  };
  // Mollie cannot reach a development machine; there the return page asks for the status.
  const lokal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/.test(o.basis);

  return {
    name: "mollie",
    async starte(z) {
      const json = await rufe("/payments", {
        method: "POST",
        body: JSON.stringify({
          amount: betrag(z.betragCent),
          description: z.beschreibung,
          redirectUrl: new URL(`/buchung/${z.token}?zahlung=zurueck`, o.basis).toString(),
          ...(lokal ? {} : { webhookUrl: new URL("/next/zahlung/mollie", o.basis).toString() }),
          locale: "de_DE",
          metadata: { buchung: z.buchungNummer, zahlung: z.zahlungId },
        }),
      });
      const links = json._links as { checkout?: { href?: string } } | undefined;
      const weiter = links?.checkout?.href;
      if (typeof json.id !== "string" || !weiter)
        throw new Error("Mollie hat keine Zahlungsseite genannt.");
      return { externId: json.id, weiter };
    },
    async stand(externId) {
      const json = await rufe(`/payments/${encodeURIComponent(externId)}`);
      return standAusMollie(String(json.status ?? ""));
    },
    async erstatte(externId, betragCent, beschreibung) {
      const json = await rufe(`/payments/${encodeURIComponent(externId)}/refunds`, {
        method: "POST",
        body: JSON.stringify({ amount: betrag(betragCent), description: beschreibung }),
      });
      if (typeof json.id !== "string")
        throw new Error("Mollie hat die Erstattung nicht bestätigt.");
      return json.id;
    },
  };
}
