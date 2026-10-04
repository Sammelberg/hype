import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { PaketEditor } from "../_components/paket-editor";

export const metadata: Metadata = { title: "Neues Paket" };

export default async function NeuesPaketPage() {
  await requireRole("admin");
  return <PaketEditor id={null} paket={null} />;
}
