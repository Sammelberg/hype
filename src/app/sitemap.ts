import type { MetadataRoute } from "next";

import { getProjekte, getPublishedPages } from "@/data/queries";
import { absoluteUrl } from "@/lib/seo";

// Fixed routes outside the CMS. Every published page and project is added below; the home page
// document resolves to `/` and is skipped as a duplicate.
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
  { url: absoluteUrl("/kontakt"), priority: 0.6 },
  { url: absoluteUrl("/projekte"), priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, projekte] = await Promise.all([getPublishedPages(), getProjekte()]);
  const docs = [...pages, ...projekte]
    .filter((doc) => doc.path !== "/")
    .map((doc) => ({ url: absoluteUrl(doc.path), lastModified: doc.updatedAt, priority: 0.5 }));
  return [...STATIC_ROUTES, ...docs];
}
