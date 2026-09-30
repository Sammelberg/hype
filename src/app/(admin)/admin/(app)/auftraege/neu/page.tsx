import type { Metadata } from "next";

import { listKundenAuswahl } from "@/buero/daten/kunden";
import { AuftragEditor } from "../_components/auftrag-editor";

export const metadata: Metadata = { title: "Neuer Auftrag" };

export default async function NeuerAuftragPage({
  searchParams,
}: {
  searchParams: Promise<{ kunde?: string }>;
}) {
  const [{ kunde }, kunden] = await Promise.all([searchParams, listKundenAuswahl()]);
  const kundeId = kunden.find((k) => k.id === Number(kunde))?.id;
  return (
    <AuftragEditor
      id={null}
      kunden={kunden}
      auftrag={{
        kundeId: kundeId as number,
        titel: "",
        beschreibung: null,
        betragNetto: null,
        leistungVon: null,
        leistungBis: null,
        notizen: null,
      }}
    />
  );
}
