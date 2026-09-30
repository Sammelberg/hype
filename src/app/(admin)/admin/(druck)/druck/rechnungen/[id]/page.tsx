import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ausgabeDaten, getRechnung } from "@/buero/daten/rechnungen";
import { RechnungsDokument } from "../../../../_components/buero/rechnungs-dokument";
import { DruckenKnopf } from "./drucken";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getRechnung(Number((await params).id));
  // The title becomes the PDF's file name in the print dialog.
  return { title: { absolute: found?.rechnung.nummer ?? "Rechnung" } };
}

// An issued invoice, ready to print or to save as PDF from the browser's print dialog.
export default async function DruckRechnungPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const found = await getRechnung(id);
  if (!found || found.rechnung.status === "entwurf") notFound();
  const r = found.rechnung;
  const daten = ausgabeDaten(r, found.korrigiert?.nummer ?? null);
  return (
    <main className="mx-auto flex max-w-[230mm] flex-col gap-4 px-4 py-6 print:max-w-none print:p-0">
      <div data-druck-leiste="" className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Im Druckdialog „Als PDF speichern“ wählen, um die Rechnung als PDF zu senden.
        </p>
        <DruckenKnopf />
      </div>
      <RechnungsDokument
        className="min-h-[297mm] print:shadow-none"
        daten={{
          ...daten,
          storno: r.typ === "storno",
          korrigiert: found.korrigiert?.nummer ?? null,
          kundennummer: found.kunde.nummer,
          einleitung: r.einleitung,
          schlusstext: r.schlusstext,
        }}
      />
    </main>
  );
}
