import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";

import { KundenEditor } from "../_components/kunden-editor";

export const metadata: Metadata = { title: "Neuer Kunde" };

export default async function NeuerKundePage() {
  await requireUser();
  return <KundenEditor id={null} kunde={null} />;
}
