import type { Metadata } from "next";

import { PageShell } from "../../_components/page-shell";

export const metadata: Metadata = { title: "Website" };

export default function Page() {
  return (
    <PageShell title="Website" lead="Dieser Bereich entsteht in den nächsten Etappen.">
      <p className="text-muted-foreground">Noch nichts zu sehen.</p>
    </PageShell>
  );
}
