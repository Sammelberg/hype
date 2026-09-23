import type { MetadataRoute } from "next";

import { pagePath } from "@/collections/Pages";
import { projectPath } from "@/collections/Projects";
import { getPayloadClient } from "@/lib/payload";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient();
  const published = { _status: { equals: "published" } } as const;
  const [projects, pages] = await Promise.all([
    payload.find({ collection: "projects", where: published, limit: 1000, depth: 0 }),
    payload.find({ collection: "pages", where: published, limit: 1000, depth: 0 }),
  ]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/kontakt"), priority: 0.6 },
    ...projects.docs.map((p) => ({
      url: absoluteUrl(projectPath(p.slug) ?? "/"),
      lastModified: p.updatedAt,
      priority: 0.8,
    })),
    ...pages.docs.map((p) => ({
      url: absoluteUrl(pagePath(p as unknown as Record<string, unknown>) ?? "/"),
      lastModified: p.updatedAt,
      priority: 0.5,
    })),
  ];
}
