import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { listMedia } from "@/cms/content/media";
import { getFigur } from "@/buchung/daten/stammdaten";
import { FigurEditor } from "../_components/figur-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id);
  const figur = Number.isInteger(id) ? await getFigur(id) : null;
  return { title: figur?.name ?? "Figur" };
}

export default async function FigurPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [figur, media] = await Promise.all([getFigur(id), listMedia()]);
  if (!figur) notFound();
  return <FigurEditor key={JSON.stringify(figur)} id={id} figur={figur} media={media} />;
}
