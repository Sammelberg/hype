import { describe, expect, it } from "vitest";

import { mollieAdapter, standAusMollie } from "./mollie";

function aufzeichnung(antwort: Record<string, unknown>, status = 200) {
  const rufe: { url: string; init: RequestInit }[] = [];
  const abruf = async (url: string, init: RequestInit) => {
    rufe.push({ url, init });
    return new Response(JSON.stringify(antwort), { status });
  };
  return { rufe, abruf };
}

const start = {
  zahlungId: 9,
  buchungNummer: "BU-2026-0007",
  betragCent: 4475,
  token: "abcdefghijklmnopqrstuvwx",
  beschreibung: "Anzahlung BU-2026-0007",
};

describe("mollieAdapter", () => {
  it("opens a payment with amount, description, return and webhook address, nothing personal", async () => {
    const { rufe, abruf } = aufzeichnung({
      id: "tr_WDqYK6vllg",
      _links: { checkout: { href: "https://www.mollie.com/checkout/select-method/WDqYK6vllg" } },
    });
    const a = mollieAdapter({ apiKey: "test_x", basis: "https://hype.example", abruf });
    const r = await a.starte(start);
    expect(r).toEqual({
      externId: "tr_WDqYK6vllg",
      weiter: "https://www.mollie.com/checkout/select-method/WDqYK6vllg",
    });
    expect(rufe[0]!.url).toBe("https://api.mollie.com/v2/payments");
    expect((rufe[0]!.init.headers as Record<string, string>).Authorization).toBe("Bearer test_x");
    expect(JSON.parse(String(rufe[0]!.init.body))).toEqual({
      amount: { currency: "EUR", value: "44.75" },
      description: "Anzahlung BU-2026-0007",
      redirectUrl: "https://hype.example/buchung/abcdefghijklmnopqrstuvwx?zahlung=zurueck",
      webhookUrl: "https://hype.example/next/zahlung/mollie",
      locale: "de_DE",
      metadata: { buchung: "BU-2026-0007", zahlung: 9 },
    });
  });

  it("leaves the webhook out on a development machine Mollie cannot reach", async () => {
    const { rufe, abruf } = aufzeichnung({
      id: "tr_1",
      _links: { checkout: { href: "https://m/c" } },
    });
    await mollieAdapter({ apiKey: "test_x", basis: "http://localhost:3004", abruf }).starte(start);
    expect(JSON.parse(String(rufe[0]!.init.body)).webhookUrl).toBeUndefined();
  });

  it("reads a payment's status and refunds part of it", async () => {
    const paid = aufzeichnung({ id: "tr_1", status: "paid" });
    expect(
      await mollieAdapter({ apiKey: "k", basis: "https://h", abruf: paid.abruf }).stand!("tr_1"),
    ).toBe("bezahlt");
    const refund = aufzeichnung({ id: "re_4qqhO89gsT" });
    const id = await mollieAdapter({
      apiKey: "k",
      basis: "https://h",
      abruf: refund.abruf,
    }).erstatte("tr_1", 4475, "Storno BU-2026-0007");
    expect(id).toBe("re_4qqhO89gsT");
    expect(refund.rufe[0]!.url).toBe("https://api.mollie.com/v2/payments/tr_1/refunds");
  });

  it("names Mollie's own reason when it refuses", async () => {
    const { abruf } = aufzeichnung({ detail: "The amount is lower than the minimum" }, 422);
    await expect(
      mollieAdapter({ apiKey: "k", basis: "https://h", abruf }).starte(start),
    ).rejects.toThrow(/422: The amount is lower than the minimum/);
  });
});

describe("standAusMollie", () => {
  it("maps Mollie's statuses onto ours", () => {
    expect(
      ["paid", "authorized", "canceled", "expired", "failed", "open", "pending"].map(
        standAusMollie,
      ),
    ).toEqual([
      "bezahlt",
      "bezahlt",
      "abgebrochen",
      "abgebrochen",
      "fehlgeschlagen",
      "offen",
      "offen",
    ]);
  });
});
