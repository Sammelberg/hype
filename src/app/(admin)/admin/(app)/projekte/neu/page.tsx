import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";
import { listMedia } from "@/cms/content/media";
import { emptyDocument } from "@/cms/rich-text/schema";
import { ProjektEditor } from "../_components/projekt-editor";

export const metadata: Metadata = { title: "Neues Projekt" };

export default async function NewProjektPage() {
  await requireUser();
  const media = await listMedia();
  return (
    <ProjektEditor
      projekt={null}
      editing={{ title: "", slug: "", kunde: "", summary: "", content: emptyDocument(), meta: {} }}
      media={media}
      versions={[]}
    />
  );
}
