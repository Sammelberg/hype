import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { getAngebot } from "@/buero/daten/angebote";
import { getFirma } from "@/buero/daten/firma";
import { empfaengerVon } from "@/buero/daten/kunden";
import { RechnungsDokument } from "../../../../_components/buero/rechnungs-dokument";
import { DruckenKnopf } from "../../rechnungen/[id]/drucken";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getAngebot(Number((await params).id));
  return { title: { absolute: found?.angebot.nummer ?? "Angebot" } };
}

// A sent offer, ready to print or to save as PDF.
export default async function DruckAngebotPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [found, { firma }] = await Promise.all([getAngebot(id), getFirma()]);
  if (!found || !found.angebot.nummer) notFound();
  const a = found.angebot;
  return (
    <main className="mx-auto flex max-w-[230mm] flex-col gap-4 px-4 py-6 print:max-w-none print:p-0">
      <div data-druck-leiste="" className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Im Druckdialog „Als PDF speichern“ wählen, um das Angebot als PDF zu senden.
        </p>
        <DruckenKnopf />
      </div>
      <RechnungsDokument
        className="min-h-[297mm] print:shadow-none"
        daten={{
          nummer: a.nummer,
          storno: false,
          ausgestelltAm: a.versendetAm,
          faelligAm: null,
          leistungVon: null,
          leistungBis: null,
          verkaeufer: firma,
          empfaenger: empfaengerVon(found.kunde),
          kundennummer: found.kunde.nummer,
          kleinunternehmer: firma.kleinunternehmer,
          einleitung: a.einleitung,
          schlusstext: a.schlusstext,
          positionen: a.positionen,
          angebot: { gueltigBis: a.gueltigBis },
        }}
      />
    </main>
  );
}
