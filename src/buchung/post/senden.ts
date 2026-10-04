// Sending the booking mails through the owner's mailbox (kern's cms/mail). Each kind goes out
// once per Buchung — the mail log (target „buchung“) is asked first — and only once the mailbox
// is set up; otherwise the server log notes it and the booking goes on unaffected. Relative
// imports: the beat (scripts/buchung-takt.ts) sends the reminders.
import { and, eq, gte, lte } from "drizzle-orm";

import { env } from "../../env";
import { getSiteSettings } from "../../cms/content/site-settings";
import { db } from "../../cms/db/client";
import { mailsZu } from "../../cms/mail/log";
import { mailStatus, sendMail } from "../../cms/mail/send";
import { getMailSettings } from "../../cms/mail/settings";
import type { EmailKind } from "../../cms/mail/types";
import { mailDaten } from "../daten/buchen";
import { buchungen } from "../db/schema";
import { faelligeErinnerungen } from "../logik/erinnerung";
import { icsTermin } from "../logik/ics";
import * as texte from "../logik/mails";
import { buchungsUrl, oeffneLink } from "./link";

export type PostArt =
  "bestaetigt" | "reserviert" | "anfrage" | "storniert" | "erinnerung" | "vortag" | "bewertung";

const ZIEL = "buchung";
// Asking for a review is advertising in German law (BGH VI ZR 225/17): without consent only under
// § 7 Abs. 3 UWG (notice at booking, opt-out in every mail). Off until the owner and a lawyer
// decide; the text (logik/mails.ts → bewertungMail) is ready.
const BEWERTUNG_FRAGEN = false;
const TAG = 86_400_000;

async function bereit() {
  const status = await mailStatus();
  if (!status.ready)
    console.info("Buchungs-E-Mail nicht gesendet: E-Mail-Versand nicht eingerichtet.");
  return status.ready;
}

/**
 * The customer's mail of this kind for a Buchung, once. `token` when the caller still holds the
 * link (right after booking); otherwise it is opened from its sealed copy.
 */
export async function sendeBuchungsPost(
  buchungId: number,
  art: PostArt,
  o: { token?: string; folgen?: { gebuehrCent: number; erstattungCent: number } } = {},
): Promise<{ gesendet: boolean }> {
  if (!(await bereit())) return { gesendet: false };
  const d = await mailDaten(buchungId);
  if (!d) return { gesendet: false };
  const kind = `buchung_${art}` as EmailKind;
  const schon = await mailsZu({ type: ZIEL, id: buchungId });
  if (schon.some((m) => m.kind === kind)) return { gesendet: false };

  const site = await getSiteSettings();
  const siteName = site?.siteName || "Hype Agency";
  const token = o.token ?? oeffneLink(d.zugriffVersiegelt);
  const b: texte.MailBuchung = { ...d, link: token ? buchungsUrl(token) : null };
  const mail =
    art === "bestaetigt"
      ? texte.bestaetigungMail(b, siteName)
      : art === "reserviert"
        ? texte.reservierungMail(b, siteName)
        : art === "anfrage"
          ? texte.anfrageMail(b, siteName)
          : art === "storniert"
            ? texte.stornoMail(b, siteName, o.folgen ?? { gebuehrCent: 0, erstattungCent: 0 })
            : art === "erinnerung"
              ? texte.erinnerungMail(b, siteName)
              : art === "vortag"
                ? texte.vortagMail(b, siteName)
                : texte.bewertungMail(b, siteName);

  // A confirmed party goes into the customer's calendar with the party's own hours.
  const attachments =
    art === "bestaetigt"
      ? [
          {
            filename: `${d.nummer}.ics`,
            contentType: "text/calendar; charset=utf-8; method=PUBLISH",
            content: icsTermin({
              uid: `${d.nummer}@${new URL(env.NEXT_PUBLIC_SERVER_URL).hostname}`,
              beginn: d.beginn,
              ende: d.ende,
              titel: `${d.figuren.join(" und ") || "Figur"} kommt (${siteName})`,
              ort: d.adresse,
              beschreibung: b.link ? `Ihre Buchung ${d.nummer}: ${b.link}` : `Buchung ${d.nummer}`,
              jetzt: new Date(),
            }),
          },
        ]
      : undefined;

  await sendMail(
    { to: d.kontaktEmail, ...mail, attachments },
    { kind, target: { type: ZIEL, id: buchungId } },
  );
  return { gesendet: true };
}

/** The owner's note about a Buchung (new, an Anfrage, cancelled), to „Benachrichtigungen an“. */
export async function meldeInhaber(buchungId: number, was: string): Promise<{ gesendet: boolean }> {
  const { settings } = await getMailSettings();
  if (!settings.notifyAddress || !(await bereit())) return { gesendet: false };
  const d = await mailDaten(buchungId);
  if (!d) return { gesendet: false };
  const mail = texte.hinweisMail(
    { ...d, link: null },
    was,
    new URL(`/admin/buchung/buchungen/${buchungId}`, env.NEXT_PUBLIC_SERVER_URL).toString(),
  );
  await sendMail(
    { to: settings.notifyAddress, replyTo: d.kontaktEmail, ...mail },
    { kind: "buchung_hinweis", target: { type: ZIEL, id: buchungId } },
  );
  return { gesendet: true };
}

/** The reminders due now (a week ahead, the day before; the day after once allowed); each once. */
export async function sendeFaelligeErinnerungen(jetzt: Date): Promise<number> {
  const kandidaten = await db
    .select({ id: buchungen.id, beginn: buchungen.beginn, gebucht: buchungen.createdAt })
    .from(buchungen)
    .where(
      and(
        eq(buchungen.status, "bestaetigt"),
        gte(buchungen.beginn, new Date(jetzt.getTime() - 4 * TAG)),
        lte(buchungen.beginn, new Date(jetzt.getTime() + 8 * TAG)),
      ),
    );
  let gesendet = 0;
  for (const k of kandidaten) {
    const faellig = faelligeErinnerungen({ beginn: k.beginn, gebucht: k.gebucht, jetzt });
    for (const art of faellig.filter((a) => a !== "bewertung" || BEWERTUNG_FRAGEN)) {
      try {
        if ((await sendeBuchungsPost(k.id, art)).gesendet) gesendet += 1;
      } catch (error) {
        console.error(`Erinnerung „${art}“ für Buchung ${k.id} nicht gesendet`, error);
      }
    }
  }
  return gesendet;
}
