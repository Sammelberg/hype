import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listMedia } from "@/cms/content/media";
import { getProjekt } from "@/cms/content/projekte";
import { listVersions } from "@/cms/content/versions";
import { ProjektEditor } from "../_components/projekt-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const found = await getProjekt(Number(id));
  return { title: found ? found.projekt.title : "Projekt" };
}

export default async function EditProjektPage({ params }: Props) {
  const { id } = await params;
  const projektId = Number(id);
  if (!Number.isInteger(projektId)) notFound();
  const [found, media, versions] = await Promise.all([
    getProjekt(projektId),
    listMedia(),
    listVersions("projekte", projektId),
  ]);
  if (!found) notFound();
  return (
    <ProjektEditor
      key={`${found.projekt.id}-${found.projekt.updatedAt.getTime()}-${found.projekt.hasDraft}`}
      projekt={found.projekt}
      editing={found.editing}
      media={media}
      versions={versions}
    />
  );
}
