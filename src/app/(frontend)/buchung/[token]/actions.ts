"use server";

import { redirect } from "next/navigation";

import { storniereDurchKunde } from "@/buchung/daten/buchen";
import { meldeZahlung, starteAnzahlung, type ZahlungsAusgang } from "@/buchung/daten/zahlungen";
import { CmsError } from "@/cms/errors";
import { env } from "@/env";
import { onlineZahlung } from "@/lib/zahlung";

// What the customer can do behind their link: pay the Anzahlung of a held Buchung, cancel where
// the grid allows it online, and — only with ZAHLUNG_TEST — answer the pretend checkout.

export type LinkErgebnis = { fehler: string } | null;

const seite = (token: string, zusatz = "") => `/buchung/${token}${zusatz}` as never;

export async function zahleAnzahlung(token: string): Promise<LinkErgebnis> {
  const adapter = onlineZahlung();
  if (!adapter)
    return { fehler: "Die Online-Zahlung ist gerade nicht möglich. Bitte schreiben Sie uns." };
  let ziel: string;
  try {
    ziel = await starteAnzahlung(token, adapter, new Date());
  } catch (error) {
    if (error instanceof CmsError) return { fehler: error.message };
    console.error("Zahlung konnte nicht gestartet werden", error);
    return {
      fehler: "Die Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es noch einmal.",
    };
  }
  redirect(ziel as never);
}

export async function storniere(token: string): Promise<LinkErgebnis> {
  try {
    await storniereDurchKunde(token, new Date());
  } catch (error) {
    if (error instanceof CmsError) return { fehler: error.message };
    console.error("Buchung konnte nicht storniert werden", error);
    return { fehler: "Das hat nicht geklappt. Bitte versuchen Sie es noch einmal." };
  }
  redirect(seite(token, "?storniert=1"));
}

export async function antworteTestzahlung(
  token: string,
  externId: string,
  ausgang: ZahlungsAusgang,
) {
  if (env.ZAHLUNG_TEST !== "1") throw new Error("Testzahlungen sind ausgeschaltet.");
  await meldeZahlung({ adapter: "test", externId, ausgang }, new Date());
  redirect(seite(token, ausgang === "bezahlt" ? "?bezahlt=1" : "?abgebrochen=1"));
}
