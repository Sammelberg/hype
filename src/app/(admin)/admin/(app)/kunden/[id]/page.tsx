import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { listWiedervorlagen, zeitleiste } from "@/buero/daten/historie";
import { naechsteTermine } from "@/buero/daten/kalender";
import { getKunde, kundenName } from "@/buero/daten/kunden";
import { heute } from "@/buero/logik/ablauf";
import { KundenEditor } from "../_components/kunden-editor";
import { KundenUebersicht } from "../_components/kunden-uebersicht";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getKunde(Number((await params).id));
  return { title: found ? kundenName(found.kunde) : "Kunde" };
}

export default async function KundePage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const found = await getKunde(id);
  if (!found) notFound();
  const k = found.kunde;
  const [ereignisse, wiedervorlagen, termine] = await Promise.all([
    zeitleiste(id),
    listWiedervorlagen({ kundeId: id }),
    naechsteTermine(id),
  ]);
  return (
    <KundenEditor
      key={k.updatedAt.getTime()}
      id={k.id}
      nummer={k.nummer}
      titel={kundenName(k)}
      archiviert={Boolean(k.archiviertAm)}
      kunde={{
        art: k.art,
        firma: k.firma,
        name: k.name,
        email: k.email,
        telefon: k.telefon,
        strasse: k.strasse,
        plz: k.plz,
        ort: k.ort,
        land: k.land,
        ustId: k.ustId,
        leitwegId: k.leitwegId,
        zahlungszielTage: k.zahlungszielTage,
        ansprechpartner: k.ansprechpartner,
        notizen: k.notizen,
      }}
      uebersicht={
        <KundenUebersicht
          kundeId={k.id}
          heute={heute()}
          ereignisse={ereignisse}
          termine={termine}
          kundeName={kundenName(k)}
          wiedervorlagen={wiedervorlagen.map((w) => ({
            id: w.id,
            titel: w.titel,
            notiz: w.notiz,
            faelligAm: w.faelligAm,
            erledigt: false,
            kundeId: w.kundeId,
            kundeName: w.kundeName,
          }))}
          angebote={found.angebote}
          auftraege={found.auftraege}
          vertraege={found.vertraege}
          rechnungen={found.rechnungen}
        />
      }
    />
  );
}
