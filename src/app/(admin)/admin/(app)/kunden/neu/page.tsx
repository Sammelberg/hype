import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";

import { KundenEditor } from "../_components/kunden-editor";

export const metadata: Metadata = { title: "Neuer Kunde" };

export default async function NeuerKundePage() {
  await requireRole("admin");
  return <KundenEditor id={null} kunde={null} />;
}
