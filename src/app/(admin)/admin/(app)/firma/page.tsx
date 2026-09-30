import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { getFirma } from "@/buero/daten/firma";
import { FirmaEditor } from "./_components/firma-editor";

export const metadata: Metadata = { title: "Firmendaten" };

export default async function FirmaPage() {
  await requireRole("admin");
  const { firma, gespeichert } = await getFirma();
  return <FirmaEditor firma={firma} gespeichert={gespeichert} />;
}
