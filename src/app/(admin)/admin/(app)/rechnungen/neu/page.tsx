import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";
import { getAuftrag, listAuftraegeAuswahl } from "@/buero/daten/auftraege";
import { getFirma } from "@/buero/daten/firma";
import { listKundenAuswahl } from "@/buero/daten/kunden";
import { getVertrag, listVertraegeAuswahl } from "@/buero/daten/vertraege";
import { heute } from "@/buero/logik/ablauf";
import type { Position } from "@/buero/logik/typen";
import { RechnungEditor } from "../_components/rechnung-editor";

export const metadata: Metadata = { title: "Neue Rechnung" };

const monatsbeginn = (tag: string) => `${tag.slice(0, 8)}01`;

// A new draft, filled from where it was started: a customer (?kunde=), an order (?auftrag=:
// its title and price as one position, its period) or a contract (?vertrag=: its fee).
export default async function NeueRechnungPage({
  searchParams,
}: {
  searchParams: Promise<{ kunde?: string; auftrag?: string; vertrag?: string }>;
}) {
  await requireUser();
  const q = await searchParams;
  const [{ firma }, auftraege, vertraege, vonAuftrag, vonVertrag] = await Promise.all([
    getFirma(),
    listAuftraegeAuswahl(),
    listVertraegeAuswahl(),
    q.auftrag ? getAuftrag(Number(q.auftrag)) : null,
    q.vertrag ? getVertrag(Number(q.vertrag)) : null,
  ]);
  const kundeId =
    vonAuftrag?.auftrag.kundeId ??
    vonVertrag?.vertrag.kundeId ??
    (q.kunde ? Number(q.kunde) : undefined);
  const kunden = await listKundenAuswahl(kundeId);
  const kunde = kunden.find((k) => k.id === kundeId);
  const tag = heute();

  const position = (p: Omit<Position, "id">): Position => ({
    id: crypto.randomUUID().slice(0, 16),
    ...p,
  });
  const positionen: Position[] = vonAuftrag
    ? [
        position({
          bezeichnung: vonAuftrag.auftrag.titel,
          menge: 1,
          einheit: "LS",
          einzelpreis: Number(vonAuftrag.auftrag.betragNetto ?? 0),
          ustSatz: 19,
        }),
      ]
    : vonVertrag
      ? [
          position({
            bezeichnung: vonVertrag.vertrag.titel,
            menge: 1,
            einheit: vonVertrag.vertrag.verguetungIntervall === "monatlich" ? "MON" : "LS",
            einzelpreis: Number(vonVertrag.vertrag.verguetungNetto ?? 0),
            ustSatz: 19,
          }),
        ]
      : [position({ bezeichnung: "", menge: 1, einheit: "HUR", einzelpreis: 0, ustSatz: 19 })];

  return (
    <RechnungEditor
      id={null}
      firma={firma}
      kunden={kunden}
      auftraege={auftraege}
      vertraege={vertraege}
      rechnung={{
        kundeId: kunde?.id as number,
        auftragId: vonAuftrag?.auftrag.id ?? null,
        vertragId: vonVertrag?.vertrag.id ?? null,
        leistungVon: vonAuftrag?.auftrag.leistungVon ?? (vonVertrag ? monatsbeginn(tag) : null),
        leistungBis: vonAuftrag?.auftrag.leistungBis ?? null,
        zahlungszielTage: kunde?.zahlungszielTage ?? firma.zahlungszielTage,
        einleitung: null,
        schlusstext: null,
        positionen,
      }}
    />
  );
}
