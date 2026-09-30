import type { MetadataRoute } from "next";

import { getProjekte, getPublishedPages } from "@/data/queries";
import { absoluteUrl } from "@/lib/seo";

// Every published page and project; the home page resolves to `/` and leads the list. The pages
// with a route of their own (/leistungen, /projekte, /kontakt) are pages too, so they are listed
// like any other.
const PRIORITY: Record<string, number> = { "/kontakt": 0.6, "/projekte": 0.6, "/leistungen": 0.6 };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, projekte] = await Promise.all([getPublishedPages(), getProjekte()]);
  const docs = [...pages, ...projekte]
    .filter((doc) => doc.path !== "/")
    .map((doc) => ({
      url: absoluteUrl(doc.path),
      lastModified: doc.updatedAt,
      priority: PRIORITY[doc.path] ?? 0.5,
    }));
  return [{ url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 }, ...docs];
}
