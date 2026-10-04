import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { listMedia } from "@/cms/content/media";
import { FigurEditor } from "../_components/figur-editor";

export const metadata: Metadata = { title: "Neue Figur" };

export default async function NeueFigurPage() {
  await requireRole("admin");
  return <FigurEditor id={null} figur={null} media={await listMedia()} />;
}
