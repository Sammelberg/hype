import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { listFiguren } from "@/buchung/daten/stammdaten";
import { DarstellerEditor } from "../_components/darsteller-editor";

export const metadata: Metadata = { title: "Neuer Darsteller" };

export default async function NeuerDarstellerPage() {
  await requireRole("admin");
  const figuren = await listFiguren();
  return (
    <DarstellerEditor
      id={null}
      darsteller={null}
      figuren={figuren.map((f) => ({ id: f.id, name: f.name }))}
    />
  );
}
