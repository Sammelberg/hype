import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";
import { listPages } from "@/cms/content/pages";
import { listProjekte } from "@/cms/content/projekte";
import { listRedirects } from "@/cms/content/redirects";
import { PageShell } from "../../_components/page-shell";
import { RedirectsManager } from "./_components/redirects-manager";

export const metadata: Metadata = { title: "Weiterleitungen" };

export default async function RedirectsPage() {
  await requireUser();
  const [redirects, pages, projekte] = await Promise.all([
    listRedirects(),
    listPages(),
    listProjekte(),
  ]);
  return (
    <PageShell
      title="Weiterleitungen"
      lead="Alte Adressen, die weiter funktionieren sollen: Links aus Mails, Visitenkarten, Suchmaschinen."
    >
      <RedirectsManager redirects={redirects} pages={pages} projekte={projekte} />
    </PageShell>
  );
}
