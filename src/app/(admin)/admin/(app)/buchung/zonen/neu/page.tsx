import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { ZoneEditor } from "../_components/zone-editor";

export const metadata: Metadata = { title: "Neue Zone" };

export default async function NeueZonePage() {
  await requireRole("admin");
  return <ZoneEditor code={null} zone={null} />;
}
