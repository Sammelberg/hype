// Public URL of every collection that has a frontend route. Redirect targets, rich-text links,
// live preview and the sitemap all resolve paths through this map — a new routed collection
// (e.g. `posts` → /beitraege/[slug]) is added here once, next to its route.
export const HOME_SLUG = "startseite";

type PathFor = (doc: Record<string, unknown>) => string | null;

// A page's stored path (content/pages.ts keeps it; the home page's is `/`).
export const pagePath: PathFor = (doc) => {
  if (typeof doc.path === "string") return doc.path;
  if (doc.slug === HOME_SLUG) return "/";
  return doc.slug ? `/${String(doc.slug)}` : null;
};

export const projektPathOf = (slug: string) => `/projekte/${slug}`;

export const projektPath: PathFor = (doc) => (doc.slug ? projektPathOf(String(doc.slug)) : null);

const routedCollections = {
  pages: pagePath,
  projekte: projektPath,
} satisfies Record<string, PathFor>;

export type RoutedCollection = keyof typeof routedCollections;

export const ROUTED_COLLECTIONS = Object.keys(routedCollections) as RoutedCollection[];

export function docPath(collection: string | undefined, doc: Record<string, unknown>) {
  const pathFor: PathFor | undefined = routedCollections[collection as RoutedCollection];
  return pathFor ? pathFor(doc) : null;
}
