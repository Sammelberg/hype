import "server-only";

import { draftMode } from "next/headers";
import { cache } from "react";

import { getPayloadClient } from "@/lib/payload";

export const getSiteSettings = cache(async () => {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: "site-settings", depth: 0 });
});

export const getPublishedProjects = cache(async () => {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "projects",
    where: { _status: { equals: "published" } },
    sort: "-year",
    limit: 100,
    depth: 1,
  });
  return docs;
});

export const getProjectBySlug = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode();
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "projects",
    where: { slug: { equals: slug } },
    draft,
    overrideAccess: draft,
    limit: 1,
    depth: 2,
  });
  return docs[0] ?? null;
});

export const getPageByPath = cache(async (segments: string[]) => {
  const { isEnabled: draft } = await draftMode();
  const payload = await getPayloadClient();
  const slug = segments.at(-1);
  if (!slug) return null;
  const { docs } = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    draft,
    overrideAccess: draft,
    limit: 1,
    depth: 2,
  });
  const page = docs[0];
  const expected = `/${segments.join("/")}`;
  const actual = page?.breadcrumbs?.at(-1)?.url ?? (page ? `/${page.slug}` : null);
  return page && actual === expected ? page : null;
});
