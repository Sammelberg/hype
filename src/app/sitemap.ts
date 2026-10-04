import type { MetadataRoute } from "next";

import { getKatalog, getStaedte } from "@/data/katalog";
import { getProjekte, getPublishedPages } from "@/data/queries";
import { absoluteUrl } from "@/lib/seo";

// Every published page and project; the home page resolves to `/` and leads the list. The pages
// with a route of their own (/leistungen, /projekte, /kontakt) are pages too, so they are listed
// like any other.
const PRIORITY: Record<string, number> = { "/kontakt": 0.6, "/projekte": 0.6, "/leistungen": 0.6 };

// Figuren and towns change in the admin without a revalidation of their own; an hour is fresh
// enough for search engines.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, projekte, figuren, staedte] = await Promise.all([
    getPublishedPages(),
    getProjekte(),
    getKatalog(),
    getStaedte(),
  ]);
  const docs = [...pages, ...projekte]
    .filter((doc) => doc.path !== "/")
    .map((doc) => ({
      url: absoluteUrl(doc.path),
      lastModified: doc.updatedAt,
      priority: PRIORITY[doc.path] ?? 0.5,
    }));
  // The booking engine's pages (src/buchung): the catalogue, the price list, every Figur and
  // every town with a landing page of its own.
  // The three language versions of the home page name each other (hreflang).
  const sprachen = {
    languages: { "de-DE": absoluteUrl("/"), uk: absoluteUrl("/uk"), ru: absoluteUrl("/ru") },
  };
  const buchung = [
    { url: absoluteUrl("/uk"), priority: 0.7, alternates: sprachen },
    { url: absoluteUrl("/ru"), priority: 0.7, alternates: sprachen },
    { url: absoluteUrl("/figuren"), priority: 0.8 },
    { url: absoluteUrl("/preise"), priority: 0.8 },
    ...figuren.map((f) => ({ url: absoluteUrl(`/figuren/${f.slug}`), priority: 0.7 })),
    ...staedte
      .filter((s) => s.seite)
      .map((s) => ({ url: absoluteUrl(`/kindergeburtstag/${s.slug}`), priority: 0.8 })),
  ];
  return [{ url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 }, ...buchung, ...docs];
}
