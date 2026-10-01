import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listWiedervorlagen, type WiedervorlageZeile } from "@/buero/daten/historie";
import { heute } from "@/buero/logik/ablauf";
import {
  NeueWiedervorlage,
  WiedervorlagenListe,
  type WiedervorlagePunkt,
} from "../../_components/buero/wiedervorlage";
import { PageShell } from "../../_components/page-shell";

export const metadata: Metadata = { title: "Wiedervorlagen" };

const punkt = (w: WiedervorlageZeile): WiedervorlagePunkt => ({
  id: w.id,
  titel: w.titel,
  notiz: w.notiz,
  faelligAm: w.faelligAm,
  erledigt: w.erledigtAm !== null,
  kundeId: w.kundeId,
  kundeName: w.kundeName,
});

// What is to be picked up again: due today and earlier first, then what comes, then the last
// ones done.
export default async function WiedervorlagenPage() {
  await requireRole("admin");
  const tag = heute();
  const [offen, erledigt] = await Promise.all([
    listWiedervorlagen(),
    listWiedervorlagen({ erledigt: true }),
  ]);
  const faellig = offen.filter((w) => w.faelligAm <= tag);
  const spaeter = offen.filter((w) => w.faelligAm > tag);
  const gruppen = [
    {
      titel: "Fällig",
      beschreibung: "Heute und früher.",
      punkte: faellig,
      leer: "Heute ist nichts fällig.",
    },
    {
      titel: "Demnächst",
      beschreibung: "Nach Datum.",
      punkte: spaeter,
      leer: "Nichts weiter vorgemerkt.",
    },
    {
      titel: "Erledigt",
      beschreibung: "Die letzten fünfzig.",
      punkte: erledigt,
      leer: "Noch nichts erledigt.",
    },
  ];
  return (
    <PageShell
      title="Wiedervorlagen"
      lead={
        faellig.length > 0
          ? `${faellig.length} heute fällig, ${spaeter.length} später.`
          : "Was Sie an einem Tag wieder in die Hand nehmen wollen; beim Kunden oder für sich."
      }
      actions={<NeueWiedervorlage heute={tag} variant="default" label="Neue Wiedervorlage" />}
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {gruppen.map((g, index) => (
          <Card
            key={g.titel}
            className={index === 2 ? "rise-in lg:col-span-2" : "rise-in"}
            style={{ "--rise-index": index } as React.CSSProperties}
          >
            <CardHeader>
              <CardTitle>{g.titel}</CardTitle>
              <CardDescription>{g.beschreibung}</CardDescription>
            </CardHeader>
            <CardContent>
              <WiedervorlagenListe punkte={g.punkte.map(punkt)} heute={tag} leer={g.leer} />
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
