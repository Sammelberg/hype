import "server-only";

import { revalidatePath } from "next/cache";

// The site is static; publishing rebuilds the paths a change touches, right away.
export function revalidatePaths(paths: (string | null | undefined)[]) {
  for (const path of new Set(paths)) if (path) revalidatePath(path);
}

// A document was published, unpublished, moved or deleted: its old and new paths, the sitemap,
// and the layout (navigation, footer) that lists it.
export function revalidateDocument(paths: string[]) {
  revalidatePaths(paths);
  revalidatePath("/sitemap.xml");
  revalidatePath("/", "layout");
}

// The settings feed every page's header, footer and the home sections.
export function revalidateSite() {
  revalidatePath("/", "layout");
}
