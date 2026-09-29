import type { Metadata } from "next";

import { listMedia } from "@/cms/content/media";
import { PageShell } from "../../_components/page-shell";
import { MediaLibrary } from "./_components/media-library";

export const metadata: Metadata = { title: "Medien" };

export default async function MediaPage() {
  const media = await listMedia();
  return (
    <PageShell
      title="Medien"
      lead="Bilder für Seiten und Projekte. Jedes Bild braucht eine Beschreibung."
      wide
    >
      <MediaLibrary media={media} />
    </PageShell>
  );
}
