import type { Metadata } from "next";

import { pagePath } from "@/collections/Pages";
import { RichText } from "@/components/site/rich-text";
import { getPayloadClient } from "@/lib/payload";
import { getPageByPath } from "@/lib/queries";
import { redirectOrNotFound } from "@/lib/redirect-or-not-found";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string[] }> };

export async function generateStaticParams() {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "pages",
    where: { _status: { equals: "published" } },
    limit: 1000,
    depth: 0,
  });
  return docs
    .map((doc) => pagePath(doc as unknown as Record<string, unknown>))
    .filter((path): path is string => Boolean(path))
    .map((path) => ({ slug: path.split("/").filter(Boolean) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageByPath(slug);
  if (!page) return {};
  return buildMetadata({
    meta: page.meta,
    fallbackTitle: page.title,
    path: pagePath(page as unknown as Record<string, unknown>) ?? "/",
  });
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageByPath(slug);
  if (!page) return redirectOrNotFound(`/${slug.join("/")}`);

  return (
    <main className="page-container max-w-3xl pt-section">
      <h1 className="text-4xl font-semibold tracking-tight text-balance">{page.title}</h1>
      <RichText data={page.content} className="mt-10" />
    </main>
  );
}
