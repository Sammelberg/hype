import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { heute as heuteTag, tagePlus } from "@/buero/logik/ablauf";
import { berlinUhrzeit } from "@/buero/logik/kalender";
import { wochenPlan } from "@/buchung/daten/buchungen";
import { listDarsteller } from "@/buchung/daten/stammdaten";
import { STATUS_NAMEN } from "@/buchung/logik/typen";
import { kalenderwoche, legeWocheAus, woche } from "@/buchung/logik/woche";
import { PageShell } from "../../../_components/page-shell";
import { WochenKalender, type BlockInfo } from "./_components/wochen-kalender";

export const metadata: Metadata = { title: "Wochenplan" };

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const tagName = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "numeric",
  month: "numeric",
  timeZone: "UTC",
});
const monat = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<{ woche?: string; darsteller?: string }>;
}) {
  await requireRole("admin");
  const p = await searchParams;
  const jetzt = new Date();
  const heute = heuteTag(jetzt);
  const w = woche(p.woche && TAG.test(p.woche) ? p.woche : heute);
  const gewaehlt = Number(p.darsteller) || null;

  const [plan, personen] = await Promise.all([
    wochenPlan(w, { jetzt, darstellerId: gewaehlt }),
    listDarsteller(),
  ]);
  const aktiv = personen.filter((d) => d.aktiv).map((d) => ({ id: d.id, name: d.name }));

  const infos: Record<string, BlockInfo> = {};
  const eintraege = plan.map((e) => {
    const key = String(e.id);
    const zeit = e.beginn
      ? `${berlinUhrzeit(e.beginn)}–${e.partyEnde ? berlinUhrzeit(e.partyEnde) : ""}`
      : `${berlinUhrzeit(e.von)}–${berlinUhrzeit(e.bis)}`;
    infos[key] =
      e.art === "einsatz" && e.buchung
        ? {
            art: "einsatz",
            href: `/admin/buchung/buchungen/${e.buchung.id}`,
            titel: `${zeit} ${e.buchung.figur ?? ""}`.trim(),
            zeile: [e.buchung.stadt, gewaehlt ? null : e.darstellerName]
              .filter(Boolean)
              .join(" · "),
            beschreibung: `${zeit}, ${e.buchung.figur ?? "Figur"} in ${e.buchung.stadt ?? "?"}, ${e.darstellerName}, ${STATUS_NAMEN[e.buchung.status]}, ${e.buchung.nummer}`,
            reserviert: e.buchung.status === "reserviert",
            darstellerId: e.darstellerId,
          }
        : {
            art: "sperre",
            href: null,
            titel: `Gesperrt ${zeit}`,
            zeile: [e.grund, gewaehlt ? null : e.darstellerName].filter(Boolean).join(" · "),
            beschreibung: `Gesperrt ${zeit}, ${e.darstellerName}${e.grund ? `, ${e.grund}` : ""}`,
            reserviert: false,
            darstellerId: e.darstellerId,
          };
    return {
      key,
      von: e.von,
      bis: e.bis,
      beginn: e.beginn ?? undefined,
      partyEnde: e.partyEnde ?? undefined,
    };
  });

  const ersterTag = new Date(`${w.tage[0]}T00:00:00Z`);
  const titel = `KW ${kalenderwoche(w.tage[0]!)} · ${monat.format(ersterTag)}`;

  return (
    <PageShell
      title="Wochenplan"
      lead="Alle Einsätze und Sperren der Woche. Die Fahrt zählt mit: so lange ist der Darsteller unterwegs."
      wide
    >
      <WochenKalender
        titel={titel}
        tage={w.tage}
        tagNamen={w.tage.map((t) => tagName.format(new Date(`${t}T00:00:00Z`)))}
        bloecke={legeWocheAus(w.tage, eintraege)}
        infos={infos}
        darsteller={aktiv}
        gewaehlt={gewaehlt}
        vorher={tagePlus(w.tage[0]!, -7)}
        nachher={tagePlus(w.tage[0]!, 7)}
        heute={heute}
      />
    </PageShell>
  );
}
