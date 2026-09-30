import type { Metadata } from "next";

import { KundenEditor } from "../_components/kunden-editor";

export const metadata: Metadata = { title: "Neuer Kunde" };

export default function NeuerKundePage() {
  return <KundenEditor id={null} kunde={null} />;
}
