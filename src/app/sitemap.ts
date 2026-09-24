import type { MetadataRoute } from "next";

import { docPath, ROUTED_COLLECTIONS } from "@/cms/paths";
import { getPayloadClient } from "@/data/payload";
import { absoluteUrl } from "@/lib/seo";

// Fixed routes outside the CMS. Every published document of a routed collection (src/cms/paths.ts)
// is added below; the home page document resolves to `/` and is skipped as a duplicate.
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
  { url: absoluteUrl("/kontakt"), priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient();
  const collections = await Promise.all(
    ROUTED_COLLECTIONS.map(async (collection) => {
      const { docs } = await payload.find({
        collection,
        where: { _status: { equals: "published" } },
        limit: 1000,
        depth: 0,
      });
      return docs.flatMap((doc) => {
        const path = docPath(collection, doc as unknown as Record<string, unknown>);
        return path && path !== "/"
          ? [{ url: absoluteUrl(path), lastModified: doc.updatedAt, priority: 0.5 }]
          : [];
      });
    }),
  );
  return [...STATIC_ROUTES, ...collections.flat()];
}
