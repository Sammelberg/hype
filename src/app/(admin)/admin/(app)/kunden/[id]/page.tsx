import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/cms/auth/guard";
import { getKunde, kundenName } from "@/buero/daten/kunden";
import { KundenEditor } from "../_components/kunden-editor";
import { KundenUebersicht } from "../_components/kunden-uebersicht";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getKunde(Number((await params).id));
  return { title: found ? kundenName(found.kunde) : "Kunde" };
}

export default async function KundePage({ params }: Props) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const found = await getKunde(id);
  if (!found) notFound();
  const k = found.kunde;
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
          auftraege={found.auftraege}
          vertraege={found.vertraege}
          rechnungen={found.rechnungen}
        />
      }
    />
  );
}
