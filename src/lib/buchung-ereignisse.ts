import "server-only";

import { after } from "next/server";

import { merkeLink } from "@/buchung/daten/buchen";
import { erstatteAnzahlung } from "@/buchung/daten/zahlungen";
import type { StornoErgebnis } from "@/buchung/logik/storno";
import { versiegleLink } from "@/buchung/post/link";
import { meldeInhaber, sendeBuchungsPost, type PostArt } from "@/buchung/post/senden";
import { adapterFuer } from "@/lib/zahlung";

// What follows the moments of a Buchung, in one place for the website, the webhook and the admin:
// the link is kept sealed at once (before the customer is sent on), the mails go out after the
// response, so a slow mail server never holds up a booking or a payment.

const spaeter = (was: string, fn: () => Promise<unknown>) =>
  after(() => fn().catch((error) => console.error(`${was} nicht gesendet`, error)));

/** A new Buchung or Anfrage with its link: kept sealed; the customer's mail and the owner's note. */
export async function nachNeuerBuchung(
  buchungId: number,
  token: string,
  art: Extract<PostArt, "anfrage" | "reserviert" | "bestaetigt"> | null,
  hinweis: string | null,
) {
  await merkeLink(buchungId, versiegleLink(token));
  if (art) spaeter("Buchungs-E-Mail", () => sendeBuchungsPost(buchungId, art, { token }));
  if (hinweis) spaeter("Hinweis an den Inhaber", () => meldeInhaber(buchungId, hinweis));
}

/** The Anzahlung came in or the owner confirmed: the confirmation with its calendar entry. */
export function nachBestaetigung(buchungId: number, hinweis: string | null = "Neue Buchung") {
  spaeter("Bestätigung", () => sendeBuchungsPost(buchungId, "bestaetigt"));
  if (hinweis) spaeter("Hinweis an den Inhaber", () => meldeInhaber(buchungId, hinweis));
}

/**
 * A cancellation: pays back what the grid returns through the adapter it was paid with, then the
 * customer's mail and the owner's note. A refund that fails is reported to the owner, never to
 * the customer as done.
 */
export async function nachStorno(
  buchungId: number,
  storno: StornoErgebnis,
  /** The owner's note; null when the owner cancelled it themselves. */
  hinweis: string | null,
) {
  let erstattungCent = storno.erstattungCent;
  let fehlt = false;
  try {
    const r = await erstatteAnzahlung(buchungId, storno.erstattungCent, adapterFuer, new Date());
    if (!r) erstattungCent = 0;
  } catch (error) {
    console.error(`Erstattung für Buchung ${buchungId} fehlgeschlagen`, error);
    fehlt = storno.erstattungCent > 0;
  }
  spaeter("Storno-E-Mail", () =>
    sendeBuchungsPost(buchungId, "storniert", {
      folgen: { gebuehrCent: storno.gebuehrCent, erstattungCent: fehlt ? 0 : erstattungCent },
    }),
  );
  if (hinweis || fehlt)
    spaeter("Hinweis an den Inhaber", () =>
      meldeInhaber(
        buchungId,
        fehlt ? `${hinweis ?? "Storniert"} – Erstattung bitte von Hand anweisen` : hinweis!,
      ),
    );
}
