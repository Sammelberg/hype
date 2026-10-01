import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";
import { listMedia, mediaVerwendung } from "@/cms/content/media";
import { PageShell } from "../../_components/page-shell";
import { MediaLibrary } from "./_components/media-library";

export const metadata: Metadata = { title: "Medien" };

export default async function MediaPage() {
  await requireUser();
  const [media, verwendung] = await Promise.all([listMedia(), mediaVerwendung()]);
  return (
    <PageShell
      title="Medien"
      lead="Bilder für Seiten und Projekte. Jedes Bild braucht eine Beschreibung."
      wide
    >
      <MediaLibrary media={media} verwendung={Object.fromEntries(verwendung)} />
    </PageShell>
  );
}
