import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getContactForm } from "@/cms/content/forms";
import { listMedia } from "@/cms/content/media";
import { getPage, listPages } from "@/cms/content/pages";
import { listProjekte } from "@/cms/content/projekte";
import { getSiteSettings } from "@/cms/content/site-settings";
import { listVersions } from "@/cms/content/versions";
import { PageEditor } from "../_components/page-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const found = await getPage(Number(id));
  return { title: found ? found.page.title : "Seite" };
}

export default async function EditPagePage({ params }: Props) {
  const { id } = await params;
  const pageId = Number(id);
  if (!Number.isInteger(pageId)) notFound();
  const [found, pages, media, versions, projekte, form, settings] = await Promise.all([
    getPage(pageId),
    listPages(),
    listMedia(),
    listVersions("pages", pageId),
    listProjekte(),
    getContactForm(),
    getSiteSettings(),
  ]);
  if (!found) notFound();
  return (
    <PageEditor
      key={`${found.page.id}-${found.page.updatedAt.getTime()}-${found.page.hasDraft}`}
      page={found.page}
      editing={found.editing}
      pages={pages}
      media={media}
      versions={versions}
      projekte={projekte}
      form={form}
      cta={settings?.cta ?? null}
    />
  );
}
