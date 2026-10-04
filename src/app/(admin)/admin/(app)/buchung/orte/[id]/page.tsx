import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { getStadt, listZonen } from "@/buchung/daten/stammdaten";
import { StadtEditor } from "../_components/stadt-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id);
  const stadt = Number.isInteger(id) ? await getStadt(id) : null;
  return { title: stadt?.name ?? "Ort" };
}

export default async function OrtPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [stadt, zonen] = await Promise.all([getStadt(id), listZonen()]);
  if (!stadt) notFound();
  return <StadtEditor key={JSON.stringify(stadt)} id={id} stadt={stadt} zonen={zonen} />;
}
