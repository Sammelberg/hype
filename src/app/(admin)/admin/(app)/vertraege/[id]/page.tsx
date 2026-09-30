import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAuftraegeAuswahl } from "@/buero/daten/auftraege";
import { kundenName, listKundenAuswahl } from "@/buero/daten/kunden";
import { getVertrag, vertragsende } from "@/buero/daten/vertraege";
import { datumDe, heute } from "@/buero/logik/ablauf";
import { centAusBetrag, euro, rechnungsSummen } from "@/buero/logik/geld";
import { DokumentKachel } from "../../../_components/buero/kachel";
import { RechnungStatus } from "../../../_components/buero/status";
import { VertragEditor } from "../_components/vertrag-editor";
import { VertragSchritte } from "../_components/vertrag-schritte";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getVertrag(Number((await params).id));
  return { title: found ? found.vertrag.titel : "Vertrag" };
}

export default async function VertragPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [found, auftraege] = await Promise.all([getVertrag(id), listAuftraegeAuswahl()]);
  if (!found) notFound();
  const { vertrag: v, kunde } = found;
  const kunden = await listKundenAuswahl(v.kundeId);
  const tag = heute();
  const ende = vertragsende(v, tag);
  const hinweis =
    v.status === "entwurf"
      ? "Ein Entwurf wird aktiv, sobald er unterzeichnet ist."
      : v.status === "aktiv"
        ? ende?.kuendigenBis
          ? `Kündbar bis ${datumDe(ende.kuendigenBis)} zum ${datumDe(ende.ende)}.`
          : `Endet am ${datumDe(ende?.ende ?? v.beginn)}.`
        : v.status === "gekuendigt"
          ? `Gekündigt; endet am ${v.endetAm ? datumDe(v.endetAm) : "—"}.`
          : "Beendet.";

  return (
    <VertragEditor
      key={v.updatedAt.getTime()}
      id={v.id}
      nummer={v.nummer}
      kunden={kunden}
      auftraege={auftraege}
      gesperrt={v.status === "beendet"}
      vertrag={{
        kundeId: v.kundeId,
        auftragId: v.auftragId,
        art: v.art,
        titel: v.titel,
        beginn: v.beginn,
        laufzeitMonate: v.laufzeitMonate,
        verlaengerungMonate: v.verlaengerungMonate,
        kuendigungsfristMonate: v.kuendigungsfristMonate,
        verguetungNetto: v.verguetungNetto === null ? null : Number(v.verguetungNetto),
        verguetungIntervall: v.verguetungIntervall,
        unterzeichnetAm: v.unterzeichnetAm,
        inhalt: v.inhalt,
      }}
      seite={
        <div className="flex flex-col gap-6 xl:sticky xl:top-36">
          <VertragSchritte
            id={v.id}
            status={v.status}
            hinweis={hinweis}
            daten={[
              { label: "Kunde", wert: kundenName(kunde) },
              ...(found.auftrag ? [{ label: "Auftrag", wert: found.auftrag.titel }] : []),
              ...(v.unterzeichnetAm
                ? [{ label: "Unterzeichnet", wert: datumDe(v.unterzeichnetAm) }]
                : []),
              ...(v.gekuendigtAm ? [{ label: "Gekündigt", wert: datumDe(v.gekuendigtAm) }] : []),
              ...(v.endetAm ? [{ label: "Endet", wert: datumDe(v.endetAm) }] : []),
            ]}
          />
          <Card>
            <CardHeader>
              <CardTitle>Rechnungen</CardTitle>
              <CardDescription>
                {found.rechnungen.length === 0
                  ? "Noch keine."
                  : `${found.rechnungen.length} insgesamt`}
              </CardDescription>
              <CardAction>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/rechnungen/neu?vertrag=${v.id}` as never}>
                    <PlusIcon data-icon="inline-start" /> Rechnung
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            {found.rechnungen.length > 0 ? (
              <CardContent>
                <ul role="list" className="flex flex-col gap-2">
                  {found.rechnungen.map((r) => (
                    <DokumentKachel
                      key={r.id}
                      href={`/admin/rechnungen/${r.id}`}
                      titel={r.nummer ?? "Entwurf"}
                      unter={r.ausgestelltAm ? datumDe(r.ausgestelltAm) : "noch nicht gestellt"}
                      betrag={euro(
                        r.summeBrutto
                          ? centAusBetrag(r.summeBrutto)
                          : rechnungsSummen(r.positionen, false).brutto,
                      )}
                      status={
                        <RechnungStatus
                          typ={r.typ}
                          status={r.status}
                          ueberfaellig={Boolean(r.faelligAm && r.faelligAm < tag)}
                        />
                      }
                    />
                  ))}
                </ul>
              </CardContent>
            ) : null}
          </Card>
        </div>
      }
    />
  );
}
