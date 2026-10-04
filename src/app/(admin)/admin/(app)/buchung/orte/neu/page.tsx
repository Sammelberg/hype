import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { listZonen } from "@/buchung/daten/stammdaten";
import { StadtEditor } from "../_components/stadt-editor";

export const metadata: Metadata = { title: "Neuer Ort" };

export default async function NeuerOrtPage() {
  await requireRole("admin");
  return <StadtEditor id={null} stadt={null} zonen={await listZonen()} />;
}
