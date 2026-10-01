import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuftrag } from "@/buero/daten/auftraege";
import { kundenName, listKundenAuswahl } from "@/buero/daten/kunden";
import { datumDe, heute } from "@/buero/logik/ablauf";
import { centAusBetrag, euro, rechnungsSummen } from "@/buero/logik/geld";
import { DokumentKachel } from "../../../_components/buero/kachel";
import { RechnungStatus, VertragStatus } from "../../../_components/buero/status";
import { AuftragEditor } from "../_components/auftrag-editor";
import { AuftragSchritte } from "../_components/auftrag-schritte";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getAuftrag(Number((await params).id));
  return { title: found ? found.auftrag.titel : "Auftrag" };
}

export default async function AuftragPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const found = await getAuftrag(id);
  if (!found) notFound();
  const { auftrag: a, kunde } = found;
  const kunden = await listKundenAuswahl(a.kundeId);
  const tag = heute();

  return (
    <AuftragEditor
      key={a.updatedAt.getTime()}
      id={a.id}
      nummer={a.nummer}
      kunden={kunden}
      auftrag={{
        kundeId: a.kundeId,
        titel: a.titel,
        beschreibung: a.beschreibung,
        betragNetto: a.betragNetto === null ? null : Number(a.betragNetto),
        leistungVon: a.leistungVon,
        leistungBis: a.leistungBis,
        notizen: a.notizen,
      }}
      seite={
        <div className="flex flex-col gap-6 xl:sticky xl:top-36">
          <AuftragSchritte
            id={a.id}
            status={a.status}
            daten={[
              { label: "Kunde", wert: kundenName(kunde) },
              ...(a.beauftragtAm ? [{ label: "Beauftragt", wert: datumDe(a.beauftragtAm) }] : []),
              ...(a.abgenommenAm ? [{ label: "Abgenommen", wert: datumDe(a.abgenommenAm) }] : []),
            ]}
          />
          {a.status === "angebot" ? (
            <Card>
              <CardHeader>
                <CardTitle>Angebot</CardTitle>
                <CardDescription>
                  Als Dokument mit Positionen, Nummer und Gültigkeit; die Zusage beauftragt diesen
                  Auftrag.
                </CardDescription>
                <CardAction>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/angebote/neu?auftrag=${a.id}` as never}>
                      <PlusIcon data-icon="inline-start" /> Angebot
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
          ) : null}
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
                  <Link href={`/admin/rechnungen/neu?auftrag=${a.id}` as never}>
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
          <Card>
            <CardHeader>
              <CardTitle>Verträge</CardTitle>
              <CardDescription>
                {found.vertraege.length === 0
                  ? "Noch keiner."
                  : `${found.vertraege.length} insgesamt`}
              </CardDescription>
              <CardAction>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/vertraege/neu?auftrag=${a.id}` as never}>
                    <PlusIcon data-icon="inline-start" /> Vertrag
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            {found.vertraege.length > 0 ? (
              <CardContent>
                <ul role="list" className="flex flex-col gap-2">
                  {found.vertraege.map((v) => (
                    <DokumentKachel
                      key={v.id}
                      href={`/admin/vertraege/${v.id}`}
                      titel={v.titel}
                      unter={v.nummer}
                      status={<VertragStatus status={v.status} />}
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
