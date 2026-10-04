import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { getPaket } from "@/buchung/daten/stammdaten";
import { PaketEditor } from "../_components/paket-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id);
  const paket = Number.isInteger(id) ? await getPaket(id) : null;
  return { title: paket?.name ?? "Paket" };
}

export default async function PaketPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const paket = await getPaket(id);
  if (!paket) notFound();
  return <PaketEditor key={JSON.stringify(paket)} id={id} paket={paket} />;
}
