// Pure functions over the page tree: public paths, breadcrumbs, moves. The repository
// (content/pages.ts) applies them inside a transaction; the admin uses them for previews.
import type { Breadcrumb } from "./types";

export const HOME_SLUG = "startseite";

// Pages that must always exist: the footer links them and the Datenschutzerklärung describes the site.
export const PROTECTED_SLUGS = new Set([HOME_SLUG, "impressum", "datenschutz"]);

export type TreeNode = { id: number; slug: string; title: string; parentId: number | null };

// The public path of a page: `/` for the home page, else the parent's path plus the slug.
export function pathOf(slug: string, parentPath: string | null): string {
  if (slug === HOME_SLUG && !parentPath) return "/";
  const base = parentPath && parentPath !== "/" ? parentPath : "";
  return `${base}/${slug}`;
}

// id → path for every node, parents resolved first. Orphans (a parent that is not in the list)
// are treated as top level, so a broken tree still yields a path for every page.
export function pathsOf(nodes: readonly TreeNode[]): Map<number, string> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const paths = new Map<number, string>();
  const resolve = (node: TreeNode, seen: Set<number>): string => {
    const known = paths.get(node.id);
    if (known) return known;
    const parent = node.parentId !== null ? byId.get(node.parentId) : undefined;
    const parentPath = parent && !seen.has(parent.id) ? resolve(parent, seen.add(node.id)) : null;
    const path = pathOf(node.slug, parentPath);
    paths.set(node.id, path);
    return path;
  };
  for (const node of nodes) resolve(node, new Set());
  return paths;
}

// The trail from the top-level ancestor down to the page itself, as label/url pairs.
export function breadcrumbsOf(id: number, nodes: readonly TreeNode[]): Breadcrumb[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const paths = pathsOf(nodes);
  const trail: Breadcrumb[] = [];
  const seen = new Set<number>();
  for (let node = byId.get(id); node && !seen.has(node.id);) {
    seen.add(node.id);
    trail.unshift({ label: node.title, url: paths.get(node.id) ?? pathOf(node.slug, null) });
    node = node.parentId !== null ? byId.get(node.parentId) : undefined;
  }
  return trail;
}

// Every page below `id`, at any depth.
export function descendantsOf(id: number, nodes: readonly TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const queue = [id];
  while (queue.length) {
    const current = queue.shift()!;
    for (const node of nodes) {
      if (node.parentId === current && !result.includes(node)) {
        result.push(node);
        queue.push(node.id);
      }
    }
  }
  return result;
}

// A page may not become its own ancestor.
export function canMove(id: number, newParentId: number | null, nodes: readonly TreeNode[]) {
  if (newParentId === null) return true;
  if (newParentId === id) return false;
  return !descendantsOf(id, nodes).some((n) => n.id === newParentId);
}

export function depthOf(id: number, nodes: readonly TreeNode[]) {
  return breadcrumbsOf(id, nodes).length - 1;
}

// Depth-first order for a tree view: each page followed by its children, siblings by `order`.
export function flattenTree<T extends TreeNode>(
  nodes: readonly T[],
  order: (a: T, b: T) => number,
): (T & { depth: number })[] {
  const out: (T & { depth: number })[] = [];
  const walk = (parentId: number | null, depth: number) => {
    for (const node of [...nodes].filter((n) => n.parentId === parentId).sort(order)) {
      out.push({ ...node, depth });
      walk(node.id, depth + 1);
    }
  };
  walk(null, 0);
  // Orphans last, so nothing disappears from the list.
  for (const node of nodes) if (!out.some((n) => n.id === node.id)) out.push({ ...node, depth: 0 });
  return out;
}

// A URL segment from a title: German umlauts become their two-letter forms, everything else
// that is not a letter or digit becomes a hyphen.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
