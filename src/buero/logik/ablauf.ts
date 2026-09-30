// The life of the office's documents: their numbers, which status may follow which, and when a
// contract ends at the earliest. Pure — the admin shows the same answers the server enforces.

/** „RE-2026-0007“: prefix, year, running number per prefix and year (the counter lives in the DB). */
export const dokumentNummer = (praefix: string, jahr: number, laufend: number) =>
  `${praefix}-${jahr}-${String(laufend).padStart(4, "0")}`;

export const STATUS = {
  auftrag: ["angebot", "beauftragt", "in_arbeit", "abgenommen", "abgerechnet", "storniert"],
  vertrag: ["entwurf", "aktiv", "gekuendigt", "beendet"],
  rechnung: ["entwurf", "gestellt", "bezahlt", "storniert"],
} as const;

export type Art = keyof typeof STATUS;
export type StatusVon<A extends Art> = (typeof STATUS)[A][number];

const WECHSEL: { [A in Art]: Record<StatusVon<A>, readonly StatusVon<A>[]> } = {
  auftrag: {
    angebot: ["beauftragt", "storniert"],
    beauftragt: ["in_arbeit", "storniert"],
    in_arbeit: ["abgenommen", "storniert"],
    abgenommen: ["abgerechnet"],
    abgerechnet: [],
    storniert: [],
  },
  vertrag: {
    entwurf: ["aktiv", "beendet"],
    aktiv: ["gekuendigt", "beendet"],
    gekuendigt: ["beendet"],
    beendet: [],
  },
  // An issued invoice stays issued (GoBD): it is paid, or corrected by a Storno.
  rechnung: {
    entwurf: ["gestellt"],
    gestellt: ["bezahlt", "storniert"],
    bezahlt: ["storniert"],
    storniert: [],
  },
};

export function kannWechseln<A extends Art>(art: A, von: StatusVon<A>, nach: StatusVon<A>) {
  return (WECHSEL[art] as Record<string, readonly string[]>)[von]?.includes(nach) ?? false;
}

export const naechsteStatus = <A extends Art>(art: A, von: StatusVon<A>) =>
  (WECHSEL[art] as Record<string, readonly StatusVon<A>[]>)[von] ?? [];

// ---------------------------------------------------------------------------------------------
// Contract end. Dates are ISO days (YYYY-MM-DD), computed in UTC so no time zone shifts a day.

const tag = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const letzterTag = (jahr: number, monat: number) =>
  new Date(Date.UTC(jahr, monat + 1, 0)).getUTCDate();

/** Months later or earlier; a month's last day stays a month's last day (31.12. − 3 → 30.09.). */
function plusMonate(isoTag: string, monate: number) {
  const d = tag(isoTag);
  const [j, m, t] = [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
  const ziel = new Date(Date.UTC(j, m + monate, 1));
  const zj = ziel.getUTCFullYear();
  const zm = ziel.getUTCMonth();
  const tage = letzterTag(zj, zm);
  const tagImZiel = t === letzterTag(j, m) ? tage : Math.min(t, tage);
  return iso(new Date(Date.UTC(zj, zm, tagImZiel)));
}

const plusTage = (isoTag: string, tage: number) =>
  iso(new Date(tag(isoTag).getTime() + tage * 86_400_000));

const monatsende = (isoTag: string) => {
  const d = tag(isoTag);
  return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
};

export type Laufzeit = {
  beginn: string;
  /** Minimum term; null = open-ended, terminable at any month's end after the notice. */
  laufzeitMonate: number | null;
  /** Automatic renewal after the term; null = the contract simply ends. */
  verlaengerungMonate: number | null;
  kuendigungsfristMonate: number;
};

/** The earliest end from `heute` on, and the last day notice can be given for it. */
export function naechstesVertragsende(
  v: Laufzeit,
  heute: string,
): { ende: string; kuendigenBis: string | null } {
  if (v.laufzeitMonate === null) {
    return { ende: monatsende(plusMonate(heute, v.kuendigungsfristMonate)), kuendigenBis: heute };
  }
  let ende = plusTage(plusMonate(v.beginn, v.laufzeitMonate), -1);
  let bis = plusMonate(ende, -v.kuendigungsfristMonate);
  if (!v.verlaengerungMonate) return { ende, kuendigenBis: bis >= heute ? bis : null };
  while (bis < heute) {
    ende = plusMonate(ende, v.verlaengerungMonate);
    bis = plusMonate(ende, -v.kuendigungsfristMonate);
  }
  return { ende, kuendigenBis: bis };
}

/** Today in Germany as an ISO day — the date an invoice is issued on, whatever the server's zone. */
export const heute = (jetzt: Date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(jetzt);

export const tagePlus = (isoTag: string, tage: number) => plusTage(isoTag, tage);

export const jahr = (isoTag: string) => Number(isoTag.slice(0, 4));

const datumFormat = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC" });
/** „2026-10-01“ → „1.10.2026“. */
export const datumDe = (isoTag: string) => datumFormat.format(tag(isoTag));
