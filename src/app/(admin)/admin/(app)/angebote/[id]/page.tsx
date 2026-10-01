import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { getAngebot } from "@/buero/daten/angebote";
import { listAuftraegeAuswahl } from "@/buero/daten/auftraege";
import { getFirma } from "@/buero/daten/firma";
import { listKundenAuswahl } from "@/buero/daten/kunden";
import { heute } from "@/buero/logik/ablauf";
import { AngebotEditor } from "../_components/angebot-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getAngebot(Number((await params).id));
  return { title: found?.angebot.nummer ?? "Angebotsentwurf" };
}

export default async function AngebotPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const found = await getAngebot(id);
  if (!found) notFound();
  const a = found.angebot;
  const [{ firma }, kunden, auftraege] = await Promise.all([
    getFirma(),
    listKundenAuswahl(a.kundeId),
    listAuftraegeAuswahl(),
  ]);
  return (
    <AngebotEditor
      key={a.updatedAt.getTime()}
      id={a.id}
      firma={firma}
      kunden={kunden}
      auftraege={auftraege}
      heute={heute()}
      stand={{
        status: a.status,
        nummer: a.nummer,
        versendetAm: a.versendetAm,
        auftragId: a.auftragId,
      }}
      angebot={{
        kundeId: a.kundeId,
        auftragId: a.auftragId,
        titel: a.titel,
        einleitung: a.einleitung,
        schlusstext: a.schlusstext,
        gueltigBis: a.gueltigBis,
        positionen: a.positionen,
      }}
    />
  );
}
