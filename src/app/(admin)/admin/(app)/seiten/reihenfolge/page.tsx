import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";
import { listPages } from "@/cms/content/pages";
import { LEGAL_SLUGS } from "@/lib/site-nav";
import { PageShell } from "../../../_components/page-shell";
import { type ReihenGruppe, SeitenReihenfolge } from "../_components/seiten-reihenfolge";

export const metadata: Metadata = { title: "Reihenfolge der Seiten" };

// The pages that are not sections of the navigation: the home page, Kontakt (always last) and
// the legal pages (footer only).
const AUSSERHALB = new Set(["startseite", "kontakt", ...LEGAL_SLUGS]);

export default async function ReihenfolgePage() {
  await requireUser();
  const pages = await listPages();
  const oben = pages.filter((p) => p.parent === null && !AUSSERHALB.has(p.slug));
  const gruppen: ReihenGruppe[] = [
    {
      parentId: null,
      titel: "Bereiche",
      beschreibung: "Die Menüs der Kopfzeile und die Spalten im Fußbereich, von links nach rechts.",
      seiten: oben.map((p) => ({ id: p.id, title: p.title, path: p.path })),
    },
    ...pages
      .filter((eltern) => pages.filter((p) => p.parent === eltern.id).length > 1)
      .map((eltern) => ({
        parentId: eltern.id,
        titel: `Unter ${eltern.title}`,
        beschreibung: "So stehen sie im Menü des Bereichs und auf der Übersichtsseite.",
        seiten: pages
          .filter((p) => p.parent === eltern.id)
          .map((p) => ({ id: p.id, title: p.title, path: p.path })),
      })),
  ];
  return (
    <PageShell
      title="Reihenfolge"
      lead="Ziehen Sie eine Seite am Griff an ihren Platz, oder nutzen Sie die Pfeile. Gespeichert wird sofort."
    >
      <SeitenReihenfolge gruppen={gruppen} />
    </PageShell>
  );
}
