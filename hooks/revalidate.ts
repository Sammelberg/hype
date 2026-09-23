import { revalidatePath as nextRevalidatePath } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload";

type PathFor = (doc: Record<string, unknown>) => string | null;

// Outside a Next.js request (Payload CLI, migrations, seed scripts) there is no cache to
// invalidate and revalidatePath throws — nothing needs rebuilding then, so skip it.
const revalidatePath = (path: string, type?: "layout" | "page") => {
  try {
    nextRevalidatePath(path, type);
  } catch {
    /* not running inside Next.js */
  }
};

// Rebuild affected pages as soon as content is published, unpublished or deleted,
// instead of waiting for the ISR interval. Drafts/autosaves do not trigger a rebuild.
export const revalidateCollection = (
  pathFor: PathFor,
): { afterChange: CollectionAfterChangeHook; afterDelete: CollectionAfterDeleteHook } => ({
  afterChange: ({ doc, previousDoc, req }) => {
    if (req.context.disableRevalidate) return doc;
    const wasPublished = previousDoc?._status === "published";
    const isPublished = doc._status === "published";
    if (!wasPublished && !isPublished) return doc;
    for (const d of [doc, previousDoc]) {
      const path = d ? pathFor(d) : null;
      if (path) revalidatePath(path);
    }
    revalidatePath("/sitemap.xml");
    revalidatePath("/", "layout");
    return doc;
  },
  afterDelete: ({ doc }) => {
    const path = pathFor(doc);
    if (path) revalidatePath(path);
    revalidatePath("/", "layout");
    return doc;
  },
});

export const revalidateEverything: GlobalAfterChangeHook = ({ doc, req }) => {
  if (!req.context.disableRevalidate) revalidatePath("/", "layout");
  return doc;
};
