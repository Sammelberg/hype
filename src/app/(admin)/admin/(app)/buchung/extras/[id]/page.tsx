import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { getExtra } from "@/buchung/daten/stammdaten";
import { ExtraEditor } from "../_components/extra-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id);
  const extra = Number.isInteger(id) ? await getExtra(id) : null;
  return { title: extra?.name ?? "Extra" };
}

export default async function ExtraPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const extra = await getExtra(id);
  if (!extra) notFound();
  return <ExtraEditor key={JSON.stringify(extra)} id={id} extra={extra} />;
}
