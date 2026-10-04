import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { getZone } from "@/buchung/daten/stammdaten";
import { ZoneEditor } from "../_components/zone-editor";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const zone = await getZone((await params).code);
  return { title: zone?.name ?? "Zone" };
}

export default async function ZonePage({ params }: Props) {
  await requireRole("admin");
  const code = (await params).code;
  const zone = await getZone(code);
  if (!zone) notFound();
  return <ZoneEditor key={JSON.stringify(zone)} code={code} zone={zone} />;
}
