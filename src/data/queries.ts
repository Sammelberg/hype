import "server-only";

import { draftMode } from "next/headers";
import { cache } from "react";

import { getContactForm as contactForm } from "@/cms/content/forms";
import {
  getChildPages as childPages,
  getHomePage as homePage,
  getPageByPath as pageByPath,
  listPublishedPages,
  listPublishedPaths,
} from "@/cms/content/pages";
import { getProjektBySlug as projektBySlug, listPublishedProjekte } from "@/cms/content/projekte";
import { findRedirect as redirectFor } from "@/cms/content/redirects";
import { searchSite as search } from "@/cms/content/search";
import { emptySiteSettings, getSiteSettings as siteSettings } from "@/cms/content/site-settings";
import { siteNav } from "@/lib/site-nav";

// Every read of the site goes through here: cached per request, draft-aware where a document
// can be previewed (pages, projects, the settings). Lists and the navigation show published only.

const isDraft = cache(async () => (await draftMode()).isEnabled);

export const getSiteSettings = cache(async () => {
  const settings = await siteSettings(await isDraft());
  return settings ?? emptySiteSettings();
});

// The page with the slug „startseite“ fills `/`; null until it exists.
export const getHomePage = cache(async () => homePage(await isDraft()));

export const getPageByPath = cache(async (segments: string[]) => {
  if (segments.length === 0) return null;
  return pageByPath(`/${segments.join("/")}`, await isDraft());
});

// Published pages directly below a page, in the order they were created, for its overview of
// what lies below it (Über uns → Team, Arbeitsweise).
export const getChildPages = cache((parentId: number) => childPages(parentId));

// Every published page's path, for static params and the sitemap.
export const getPublishedPagePaths = cache(() => listPublishedPaths());

export const getPublishedPages = cache(() => listPublishedPages());

// Every page of the site as sections with the pages below them, for header, phone menu and footer.
export const getSiteNav = cache(async () => {
  const [pages, projekte] = await Promise.all([listPublishedPages(), getProjekte()]);
  return siteNav(pages, projekte);
});

// Published projects, newest first, for the /projekte overview.
export const getProjekte = cache(() => listPublishedProjekte());

export const getProjektBySlug = cache(async (slug: string) => projektBySlug(slug, await isDraft()));

// Checked before rendering a 404, so a missing document can still lead somewhere.
export const findRedirect = cache((path: string) => redirectFor(path));

// German full-text search over published pages and projects.
export const searchSite = cache((query: string) => search(query));

export const getContactForm = cache(() => contactForm());
