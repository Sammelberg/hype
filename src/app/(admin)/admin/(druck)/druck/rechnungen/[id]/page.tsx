import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { blattDaten, getRechnung } from "@/buero/daten/rechnungen";
import { RechnungsDokument } from "../../../../_components/buero/rechnungs-dokument";
import { DruckenKnopf } from "./drucken";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getRechnung(Number((await params).id));
  // The title becomes the PDF's file name in the print dialog.
  return { title: { absolute: found?.rechnung.nummer ?? "Rechnung" } };
}

// An issued invoice on paper. The PDF to send is „PDF laden“ on the invoice's page (the archived
// file); this view is for printing.
export default async function DruckRechnungPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const found = await getRechnung(id);
  if (!found || found.rechnung.status === "entwurf") notFound();
  return (
    <main className="mx-auto flex max-w-[230mm] flex-col gap-4 px-4 py-6 print:max-w-none print:p-0">
      <div data-druck-leiste="" className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Zum Versenden nehmen Sie besser „PDF laden“ auf der Seite der Rechnung: das archivierte
          PDF mit der E-Rechnung darin.
        </p>
        <DruckenKnopf />
      </div>
      <RechnungsDokument className="min-h-[297mm] print:shadow-none" daten={blattDaten(found)} />
    </main>
  );
}
