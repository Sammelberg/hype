import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";
import { PageShell } from "../_components/page-shell";

export const metadata: Metadata = { title: "Übersicht" };

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <PageShell
      title={`Guten Tag${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
      lead="Die Übersicht entsteht in Etappe 6."
    >
      <p className="text-muted-foreground">Kennzahlen, letzte Anfragen und Entwürfe folgen.</p>
    </PageShell>
  );
}
