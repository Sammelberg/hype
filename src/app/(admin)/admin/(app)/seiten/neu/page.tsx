import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";
import { listMedia } from "@/cms/content/media";
import { listPages } from "@/cms/content/pages";
import { emptyDocument } from "@/cms/rich-text/schema";
import { PageEditor } from "../_components/page-editor";

export const metadata: Metadata = { title: "Neue Seite" };

export default async function NewPagePage({
  searchParams,
}: {
  searchParams: Promise<{ unter?: string }>;
}) {
  await requireUser();
  const [{ unter }, pages, media] = await Promise.all([searchParams, listPages(), listMedia()]);
  const parentId = unter && pages.some((p) => p.id === Number(unter)) ? Number(unter) : null;
  return (
    <PageEditor
      page={null}
      editing={{
        title: "",
        slug: "",
        parentId,
        lead: null,
        content: emptyDocument(),
        meta: {},
        sections: null,
      }}
      pages={pages}
      media={media}
      versions={[]}
    />
  );
}
