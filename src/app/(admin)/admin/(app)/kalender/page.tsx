import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { kalender, listTermine, terminEingabe } from "@/buero/daten/kalender";
import { listKundenAuswahl } from "@/buero/daten/kunden";
import { heute as heuteTag, monatePlus, tagePlus } from "@/buero/logik/ablauf";
import { monatsRaster, wochenTage } from "@/buero/logik/kalender";
import { PageShell } from "../../_components/page-shell";
import { type Ansicht, Kalender } from "./_components/kalender";

export const metadata: Metadata = { title: "Kalender" };

const LISTE_TAGE = 60;
const monatsName = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const kurz = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "numeric",
  timeZone: "UTC",
});
const lang = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const utc = (iso: string) => new Date(`${iso}T12:00:00Z`);

/** ISO week number: the week's Thursday counted from the first of its year. */
function kalenderwoche(montag: string) {
  const donnerstag = utc(tagePlus(montag, 3));
  const jan1 = Date.UTC(donnerstag.getUTCFullYear(), 0, 1, 12);
  return 1 + Math.floor((donnerstag.getTime() - jan1) / 604_800_000);
}

// The calendar: the owner's Termine beside every date the office and the site know. A month, a
// week or a list of the next weeks; the URL holds the view and the day it shows (?ansicht=, ?tag=).
export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<{ ansicht?: string; tag?: string }>;
}) {
  await requireRole("admin");
  const q = await searchParams;
  const heute = heuteTag();
  const ansicht: Ansicht = q.ansicht === "woche" || q.ansicht === "liste" ? q.ansicht : "monat";
  const anker = q.tag && /^\d{4}-\d{2}-\d{2}$/.test(q.tag) ? q.tag : heute;

  const monat = anker.slice(0, 7);
  const wochen = ansicht === "monat" ? monatsRaster(monat) : [];
  const tage =
    ansicht === "monat"
      ? wochen.flat()
      : ansicht === "woche"
        ? wochenTage(anker)
        : Array.from({ length: LISTE_TAGE }, (_, i) => tagePlus(anker, i));
  const von = tage[0]!;
  const bis = tage.at(-1)!;

  const [ereignisse, termine, kunden] = await Promise.all([
    kalender(von, bis),
    listTermine(von, bis),
    listKundenAuswahl(),
  ]);

  const schritt = (richtung: 1 | -1) =>
    ansicht === "monat"
      ? monatePlus(`${monat}-01`, richtung)
      : tagePlus(anker, richtung * (ansicht === "woche" ? 7 : LISTE_TAGE));
  const link = (a: Ansicht, tag: string) => `/admin/kalender?ansicht=${a}&tag=${tag}`;
  const titel =
    ansicht === "monat"
      ? monatsName.format(utc(`${monat}-01`))
      : ansicht === "woche"
        ? `KW ${kalenderwoche(von)} · ${kurz.format(utc(von))}–${lang.format(utc(bis))}`
        : `${lang.format(utc(von))} bis ${lang.format(utc(bis))}`;

  const termineHeute = ereignisse.filter(
    (e) => e.art === "termin" && e.von <= heute && heute <= e.bis,
  ).length;
  return (
    <PageShell
      title="Kalender"
      lead={
        termineHeute > 0
          ? `Heute ${termineHeute === 1 ? "ein Termin" : `${termineHeute} Termine`}. Fälligkeiten, Fristen und Wiedervorlagen stehen von selbst darin.`
          : "Ihre Termine, dazu von selbst: Fälligkeiten, Mahnfristen, Wiedervorlagen, Kündigungsfristen und geplante Veröffentlichungen."
      }
      wide
    >
      <Kalender
        ansicht={ansicht}
        heute={heute}
        titel={titel}
        tage={tage}
        wochen={wochen}
        monat={ansicht === "monat" ? monat : null}
        ereignisse={ereignisse}
        kunden={kunden.map((k) => ({ id: k.id, name: k.name }))}
        termine={Object.fromEntries(termine.map((t) => [t.termin.id, terminEingabe(t.termin)]))}
        links={{
          zurueck: link(ansicht, schritt(-1)),
          vor: link(ansicht, schritt(1)),
          heute: link(ansicht, heute),
          ansichten: {
            monat: link("monat", anker),
            woche: link("woche", anker),
            liste: link("liste", anker),
          },
        }}
      />
    </PageShell>
  );
}
