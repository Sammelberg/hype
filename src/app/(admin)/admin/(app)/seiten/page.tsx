import type { Metadata } from "next";

import { PageShell } from "../../_components/page-shell";

export const metadata: Metadata = { title: "Seiten" };

export default function Page() {
  return (
    <PageShell title="Seiten" lead="Dieser Bereich entsteht in den nächsten Etappen.">
      <p className="text-muted-foreground">Noch nichts zu sehen.</p>
    </PageShell>
  );
}
