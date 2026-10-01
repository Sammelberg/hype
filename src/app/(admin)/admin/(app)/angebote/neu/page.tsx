import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { getAuftrag, listAuftraegeAuswahl } from "@/buero/daten/auftraege";
import { getFirma } from "@/buero/daten/firma";
import { listKundenAuswahl } from "@/buero/daten/kunden";
import { heute, tagePlus } from "@/buero/logik/ablauf";
import { AngebotEditor } from "../_components/angebot-editor";

export const metadata: Metadata = { title: "Neues Angebot" };

// A new offer, from a customer (?kunde=) or an order still at the offer stage (?auftrag=: its
// title and price as the first position).
export default async function NeuesAngebotPage({
  searchParams,
}: {
  searchParams: Promise<{ kunde?: string; auftrag?: string }>;
}) {
  await requireRole("admin");
  const q = await searchParams;
  const [{ firma }, auftraege, vonAuftrag] = await Promise.all([
    getFirma(),
    listAuftraegeAuswahl(),
    q.auftrag ? getAuftrag(Number(q.auftrag)) : null,
  ]);
  const kundeId = vonAuftrag?.auftrag.kundeId ?? (q.kunde ? Number(q.kunde) : undefined);
  const kunden = await listKundenAuswahl(kundeId);
  const tag = heute();
  const a = vonAuftrag?.auftrag;
  return (
    <AngebotEditor
      id={null}
      firma={firma}
      kunden={kunden}
      auftraege={auftraege}
      heute={tag}
      stand={{ status: "entwurf", nummer: null, versendetAm: null, auftragId: null }}
      angebot={{
        kundeId: kundeId as number,
        auftragId: a?.status === "angebot" ? a.id : null,
        titel: a?.titel ?? "",
        einleitung: null,
        schlusstext: null,
        gueltigBis: tagePlus(tag, 30),
        positionen: [
          {
            id: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
            bezeichnung: a?.titel ?? "",
            menge: 1,
            einheit: a ? "LS" : "HUR",
            einzelpreis: a?.betragNetto ? Number(a.betragNetto) : 0,
            ustSatz: 19,
          },
        ],
      }}
    />
  );
}
