import "server-only";

import { draftMode } from "next/headers";
import { cache } from "react";

import { HOME_SLUG } from "@/cms/collections/Pages";
import { getPayloadClient } from "@/data/payload";
import { normalizePath, resolveRedirect } from "@/lib/redirects";

export const getSiteSettings = cache(async () => {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: "site-settings", depth: 1 });
});

const getPageBySlug = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode();
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    draft,
    overrideAccess: draft,
    limit: 1,
    depth: 2,
  });
  return docs[0] ?? null;
});

// The page with the slug „startseite“ fills `/`; null until it exists.
export const getHomePage = () => getPageBySlug(HOME_SLUG);

export const getPageByPath = cache(async (segments: string[]) => {
  const slug = segments.at(-1);
  if (!slug || slug === HOME_SLUG) return null;
  const page = await getPageBySlug(slug);
  const expected = `/${segments.join("/")}`;
  const actual = page?.breadcrumbs?.at(-1)?.url ?? (page ? `/${page.slug}` : null);
  return page && actual === expected ? page : null;
});

// Published projects, newest first, for the /projekte overview.
export const getProjekte = cache(async () => {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "projekte",
    where: { _status: { equals: "published" } },
    sort: "-updatedAt",
    limit: 100,
    depth: 0,
  });
  return docs;
});

export const getProjektBySlug = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode();
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "projekte",
    where: { slug: { equals: slug } },
    draft,
    overrideAccess: draft,
    limit: 1,
    depth: 1,
  });
  return docs[0] ?? null;
});

// Checked before rendering a 404, so a missing document can still lead somewhere.
export const findRedirect = cache(async (path: string) => {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "redirects",
    where: { from: { equals: normalizePath(path) } },
    limit: 1,
    depth: 1,
  });
  return docs[0] ? resolveRedirect(docs[0]) : null;
});

// Word-wise, case-insensitive match on title and summary of published documents.
export const searchSite = cache(async (query: string) => {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "search",
    where: { or: [{ title: { like: query } }, { summary: { like: query } }] },
    sort: "-priority",
    limit: 50,
    depth: 0,
  });
  return docs.filter((doc) => doc.url);
});

export const getContactForm = cache(async () => {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "forms",
    where: { title: { equals: "Kontakt" } },
    limit: 1,
    depth: 0,
  });
  return docs[0] ?? null;
});
