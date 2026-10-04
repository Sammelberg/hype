import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { ExtraEditor } from "../_components/extra-editor";

export const metadata: Metadata = { title: "Neues Extra" };

export default async function NeuesExtraPage() {
  await requireRole("admin");
  return <ExtraEditor id={null} extra={null} />;
}
