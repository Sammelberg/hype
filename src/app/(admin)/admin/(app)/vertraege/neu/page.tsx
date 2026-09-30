import type { Metadata } from "next";

import { getAuftrag, listAuftraegeAuswahl } from "@/buero/daten/auftraege";
import { listKundenAuswahl } from "@/buero/daten/kunden";
import { heute } from "@/buero/logik/ablauf";
import { VertragEditor } from "../_components/vertrag-editor";

export const metadata: Metadata = { title: "Neuer Vertrag" };

// From a customer (?kunde=) or an order (?auftrag=): the contract starts with them filled in.
export default async function NeuerVertragPage({
  searchParams,
}: {
  searchParams: Promise<{ kunde?: string; auftrag?: string }>;
}) {
  const [{ kunde, auftrag }, kunden, auftraege] = await Promise.all([
    searchParams,
    listKundenAuswahl(),
    listAuftraegeAuswahl(),
  ]);
  const vonAuftrag = auftrag ? await getAuftrag(Number(auftrag)) : null;
  const kundeId = vonAuftrag?.auftrag.kundeId ?? kunden.find((k) => k.id === Number(kunde))?.id;
  return (
    <VertragEditor
      id={null}
      kunden={kunden}
      auftraege={auftraege}
      vertrag={{
        kundeId: kundeId as number,
        auftragId: vonAuftrag?.auftrag.id ?? null,
        art: "wartung",
        titel: vonAuftrag ? `Wartung und Betrieb: ${vonAuftrag.auftrag.titel}` : "",
        beginn: heute(),
        laufzeitMonate: 12,
        verlaengerungMonate: 12,
        kuendigungsfristMonate: 3,
        verguetungNetto: null,
        verguetungIntervall: "monatlich",
        unterzeichnetAm: null,
        inhalt: null,
      }}
    />
  );
}
