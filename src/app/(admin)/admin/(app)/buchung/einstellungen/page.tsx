import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { getEinstellungen } from "@/buchung/daten/stammdaten";
import { EinstellungenForm } from "./_components/einstellungen-form";

export const metadata: Metadata = { title: "Buchungsregeln" };

export default async function EinstellungenPage() {
  await requireRole("admin");
  const werte = await getEinstellungen();
  return <EinstellungenForm key={JSON.stringify(werte)} werte={werte} />;
}
