import { pagePath } from "./collections/Pages";
import { projektPath } from "./collections/Projekte";

type PathFor = (doc: Record<string, unknown>) => string | null;

// Public URL of every collection that has a frontend route. Redirect targets, the search index,
// live preview and the sitemap all resolve paths through this map — a new routed collection
// (e.g. `posts` → /beitraege/[slug]) is added here once, next to its route.
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
