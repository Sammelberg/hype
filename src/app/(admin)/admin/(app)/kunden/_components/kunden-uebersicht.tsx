import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Angebot } from "@/buero/daten/angebote";
import type { Auftrag } from "@/buero/daten/auftraege";
import type { Ereignis } from "@/buero/daten/historie";
import type { Rechnung } from "@/buero/daten/rechnungen";
import { type Vertrag, vertragsende } from "@/buero/daten/vertraege";
import { datumDe } from "@/buero/logik/ablauf";
import { centAusBetrag, euro, rechnungsSummen } from "@/buero/logik/geld";
import { DokumentKachel } from "../../../_components/buero/kachel";
import {
  AngebotStatus,
  AuftragStatus,
  RechnungStatus,
  VertragStatus,
} from "../../../_components/buero/status";
import type { WiedervorlagePunkt } from "../../../_components/buero/wiedervorlage";
import { KundenVerlauf } from "./kunden-verlauf";

// Beside the customer card: what the customer is worth, what runs, what is owed.
export function KundenUebersicht({
  kundeId,
  heute: tag,
  ereignisse,
  wiedervorlagen,
  angebote,
  auftraege,
  vertraege,
  rechnungen,
}: {
  kundeId: number;
  heute: string;
  ereignisse: Ereignis[];
  wiedervorlagen: WiedervorlagePunkt[];
  angebote: Angebot[];
  auftraege: Auftrag[];
  vertraege: Vertrag[];
  rechnungen: Rechnung[];
}) {
  const gestellt = rechnungen.filter(
    (r) => r.typ === "rechnung" && (r.status === "gestellt" || r.status === "bezahlt"),
  );
  const umsatz = gestellt.reduce((s, r) => s + centAusBetrag(r.summeNetto), 0);
  const offen = rechnungen.filter((r) => r.typ === "rechnung" && r.status === "gestellt");
  const offenSumme = offen.reduce((s, r) => s + centAusBetrag(r.summeBrutto), 0);
  const ueberfaellig = offen.filter((r) => r.faelligAm && r.faelligAm < tag).length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Auf einen Blick</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-3 gap-4">
            {[
              { label: "Umsatz netto", wert: euro(umsatz) },
              { label: "Offen", wert: euro(offenSumme) },
              { label: "Überfällig", wert: String(ueberfaellig) },
            ].map((k) => (
              <div key={k.label} className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">{k.label}</dt>
                <dd className="text-lg font-semibold tabular-nums">{k.wert}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <KundenVerlauf
        kundeId={kundeId}
        heute={tag}
        ereignisse={ereignisse}
        wiedervorlagen={wiedervorlagen}
      />

      <Card>
        <CardHeader>
          <CardTitle>Angebote</CardTitle>
          <CardDescription>
            {angebote.length === 0 ? "Noch keins." : `${angebote.length} insgesamt`}
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/angebote/neu?kunde=${kundeId}` as never}>
                <PlusIcon data-icon="inline-start" /> Angebot
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        {angebote.length > 0 ? (
          <CardContent>
            <ul role="list" className="flex flex-col gap-2">
              {angebote.map((a) => (
                <DokumentKachel
                  key={a.id}
                  href={`/admin/angebote/${a.id}`}
                  titel={a.titel}
                  unter={a.nummer ?? "Entwurf"}
                  betrag={euro(rechnungsSummen(a.positionen, false).netto)}
                  status={
                    <AngebotStatus
                      status={a.status}
                      abgelaufen={
                        a.status === "versendet" && Boolean(a.gueltigBis && a.gueltigBis < tag)
                      }
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
          <CardTitle>Aufträge</CardTitle>
          <CardDescription>
            {auftraege.length === 0 ? "Noch keiner." : `${auftraege.length} insgesamt`}
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/auftraege/neu?kunde=${kundeId}` as never}>
                <PlusIcon data-icon="inline-start" /> Auftrag
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        {auftraege.length > 0 ? (
          <CardContent>
            <ul role="list" className="flex flex-col gap-2">
              {auftraege.map((a) => (
                <DokumentKachel
                  key={a.id}
                  href={`/admin/auftraege/${a.id}`}
                  titel={a.titel}
                  unter={a.nummer}
                  betrag={a.betragNetto ? euro(centAusBetrag(a.betragNetto)) : null}
                  status={<AuftragStatus status={a.status} />}
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
            {vertraege.length === 0 ? "Noch keiner." : `${vertraege.length} insgesamt`}
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/vertraege/neu?kunde=${kundeId}` as never}>
                <PlusIcon data-icon="inline-start" /> Vertrag
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        {vertraege.length > 0 ? (
          <CardContent>
            <ul role="list" className="flex flex-col gap-2">
              {vertraege.map((v) => {
                const ende = vertragsende(v, tag);
                return (
                  <DokumentKachel
                    key={v.id}
                    href={`/admin/vertraege/${v.id}`}
                    titel={v.titel}
                    unter={
                      ende?.kuendigenBis
                        ? `Kündbar bis ${datumDe(ende.kuendigenBis)}`
                        : v.endetAm
                          ? `Endet ${datumDe(v.endetAm)}`
                          : v.nummer
                    }
                    status={<VertragStatus status={v.status} />}
                  />
                );
              })}
            </ul>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rechnungen</CardTitle>
          <CardDescription>
            {rechnungen.length === 0 ? "Noch keine." : `${rechnungen.length} insgesamt`}
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/rechnungen/neu?kunde=${kundeId}` as never}>
                <PlusIcon data-icon="inline-start" /> Rechnung
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        {rechnungen.length > 0 ? (
          <CardContent>
            <ul role="list" className="flex flex-col gap-2">
              {rechnungen.map((r) => (
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
  );
}
