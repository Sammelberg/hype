// When a Buchung may confirm itself, and which Extras are still offered. Pure, client-safe: the
// booking form hides what the server would refuse.
import { berlinTag } from "../../buero/logik/kalender";

const STUNDE = 3_600_000;
const TAG = 86_400_000;

/** Why a Buchung becomes an Anfrage instead of confirming itself; null when it may. */
export type AnfrageGrund = "kurzfristig" | "zone" | "ausserhalb" | "paket" | "extra";

type MitAnfrage = { nurAnfrage: boolean };

export function nurAnfrage(e: {
  beginn: Date;
  jetzt: Date;
  mindestVorlaufStd: number;
  /** The Zone of the chosen Stadt; null for a town outside every Zone. */
  zone: MitAnfrage | null;
  paket: MitAnfrage;
  extras: MitAnfrage[];
}): AnfrageGrund | null {
  if (e.beginn.getTime() - e.jetzt.getTime() < e.mindestVorlaufStd * STUNDE) return "kurzfristig";
  if (!e.zone) return "ausserhalb";
  if (e.zone.nurAnfrage) return "zone";
  if (e.paket.nurAnfrage) return "paket";
  if (e.extras.some((x) => x.nurAnfrage)) return "extra";
  return null;
}

/** Whole German calendar days from today to the party's day. */
export function tageBis(jetzt: Date, beginn: Date) {
  const tagMs = (d: Date) => Date.parse(`${berlinTag(d)}T00:00:00Z`);
  return Math.round((tagMs(beginn) - tagMs(jetzt)) / TAG);
}

/** The Extras that can still be made in time; the others are left out, not greyed. */
export function sichtbareExtras<E extends { vorlaufTage: number }>(
  extras: E[],
  beginn: Date,
  jetzt: Date,
): E[] {
  const tage = tageBis(jetzt, beginn);
  return extras.filter((x) => tage >= x.vorlaufTage);
}
