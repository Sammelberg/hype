"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BuchungFehler } from "@/buchung/daten/basis";
import { halteSlot } from "@/buchung/daten/belegung";
import { anfrageGrund, stelleAnfrage, type AnfrageWunsch } from "@/buchung/daten/buchen";
import { starteAnzahlung } from "@/buchung/daten/zahlungen";
import { berlinTag, berlinUhrzeit } from "@/buero/logik/kalender";
import { BuchenSchema } from "@/buchung/logik/schemas";
import { berlinStart } from "@/buchung/logik/zeit";
import { CmsError } from "@/cms/errors";
import { clientIp } from "@/cms/security/client-ip";
import { hitRateLimit } from "@/cms/security/rate-limit";
import { env } from "@/env";
import { nachNeuerBuchung } from "@/lib/buchung-ereignisse";

import { pruefeStart } from "./_lib/start-token";
import { onlineZahlung } from "@/lib/zahlung";

export type BuchenErgebnis =
  | { status: "ungueltig"; fehler: Record<string, string> }
  | { status: "belegt"; alternativen: { tag: string; uhrzeit: string }[] }
  | { status: "limit"; minuten: number }
  | { status: "fehler"; meldung: string; feld?: string };

// Enough for a family trying a few dates; a wall for a script.
const LIMIT = { limit: 10, windowSeconds: 3600 };
const NOCHMAL =
  "Das hat nicht geklappt. Bitte laden Sie die Seite neu und versuchen Sie es noch einmal.";

/**
 * Sends the booking form: validates, then either holds the slot (and goes on to the Anzahlung,
 * or to the booking's page when a Kita or company pays by invoice) or writes an Anfrage. A taken
 * slot comes back with the nearest free starts. Success leaves by redirect.
 */
export async function buche(eingabe: unknown): Promise<BuchenErgebnis> {
  const roh = (eingabe ?? {}) as Record<string, unknown>;
  // Bots fill the hidden field or send at once; they get the same line as a broken page.
  if (typeof roh.website === "string" && roh.website.length > 0)
    return { status: "fehler", meldung: NOCHMAL };
  if (pruefeStart(String(roh.start ?? ""), Date.now(), env.FORM_SECRET) !== "ok")
    return { status: "fehler", meldung: NOCHMAL };

  const geprueft = BuchenSchema.safeParse(roh);
  if (!geprueft.success) {
    const fehler: Record<string, string> = {};
    for (const issue of geprueft.error.issues) {
      const feld = String(issue.path[0] ?? "");
      fehler[feld] ??= issue.message;
    }
    return { status: "ungueltig", fehler };
  }
  const b = geprueft.data;
  const beginn = berlinStart(b.tag, b.uhrzeit);
  if (!beginn)
    return { status: "ungueltig", fehler: { uhrzeit: "Diese Uhrzeit gibt es an dem Tag nicht." } };

  const limit = await hitRateLimit(`buchen:${clientIp(await headers())}`, LIMIT);
  if (!limit.ok)
    return { status: "limit", minuten: Math.max(1, Math.ceil(limit.retryAfterSeconds / 60)) };

  const adapter = b.zahlungsart === "mollie" ? onlineZahlung() : null;
  const wunsch: AnfrageWunsch = {
    figurId: b.figurId,
    zweiteFigurId: b.zweiteFigurId,
    paketId: b.paketId,
    extraIds: b.extraIds,
    stadtId: b.stadtId,
    beginn,
    zahlungsart: b.zahlungsart === "rechnung" ? "rechnung" : (adapter?.name ?? "mollie"),
    rechnungAn: b.zahlungsart === "rechnung" ? b.rechnungAn : null,
    kontakt: { name: b.kontaktName, email: b.kontaktEmail, telefon: b.kontaktTelefon },
    adresse: { strasse: b.strasse, plz: b.plz, ort: b.ort },
    kind: { name: b.kindName, alter: b.kindAlter, anzahl: b.kinderAnzahl },
    sprache: b.sprache,
    notizKunde: b.notizKunde,
  };

  let ziel: string;
  try {
    const jetzt = new Date();
    const grund = b.art === "anfrage" ? "kurzfristig" : await anfrageGrund(wunsch, jetzt);
    if (grund) {
      const anfrage = await stelleAnfrage(wunsch, jetzt);
      await nachNeuerBuchung(anfrage.id, anfrage.zugriffToken, "anfrage", "Neue Anfrage");
      ziel = `/buchung/${anfrage.zugriffToken}?neu=anfrage`;
    } else {
      if (b.zahlungsart === "mollie" && !adapter)
        return {
          status: "fehler",
          meldung:
            "Die Online-Zahlung ist gerade nicht möglich. Bitte wählen Sie die Rechnung oder schreiben Sie uns.",
        };
      const r = await halteSlot(wunsch, { jetzt, quelle: "web" });
      if (!r.ok && r.grund === "belegt")
        return {
          status: "belegt",
          alternativen: r.alternativen.map((d) => ({
            tag: berlinTag(d),
            uhrzeit: berlinUhrzeit(d),
          })),
        };
      if (!r.ok) {
        // The rules changed between the form and now (it became short notice): an Anfrage.
        const anfrage = await stelleAnfrage(wunsch, jetzt);
        await nachNeuerBuchung(anfrage.id, anfrage.zugriffToken, "anfrage", "Neue Anfrage");
        ziel = `/buchung/${anfrage.zugriffToken}?neu=anfrage`;
      } else if (!adapter) {
        await nachNeuerBuchung(
          r.buchung.id,
          r.buchung.zugriffToken,
          "reserviert",
          "Neue Buchung auf Rechnung",
        );
        ziel = `/buchung/${r.buchung.zugriffToken}?neu=rechnung`;
      } else {
        // The confirmation follows the payment; until then only the link is kept.
        await nachNeuerBuchung(r.buchung.id, r.buchung.zugriffToken, null, null);
        ziel = await starteAnzahlung(r.buchung.zugriffToken, adapter, jetzt);
      }
    }
  } catch (error) {
    if (error instanceof BuchungFehler || error instanceof CmsError)
      return { status: "fehler", meldung: error.message, feld: error.field };
    console.error("Buchung konnte nicht angelegt werden", error);
    return { status: "fehler", meldung: NOCHMAL };
  }
  redirect(ziel as never);
}
