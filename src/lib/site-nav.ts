// The site's pages as navigation: every top-level page of the CMS as a section with the pages
// below it, plus the sections written in code (Projekte with its projects, Kontakt). The header,
// the phone menu and the footer all show this, so a page published in /admin appears everywhere.

export type NavLink = { label: string; href: string };
export type NavSection = NavLink & { children: NavLink[] };

type Page = {
  id: number;
  title: string;
  slug?: string | null;
  parent?: number | { id: number } | null;
  breadcrumbs?: { url?: string | null }[] | null;
};
type Projekt = { title: string; slug?: string | null };

/** Pages that live in the footer only (Impressum, Datenschutz). */
export const LEGAL_SLUGS: ReadonlySet<string> = new Set(["impressum", "datenschutz"]);
const HIDDEN = new Set(["startseite", ...LEGAL_SLUGS]);
/** Known sections first, in this order; any other top-level page follows them. */
const ORDER = ["leistungen", "branchen", "projekte", "ueber-uns"];

const urlOf = (page: Page) => page.breadcrumbs?.at(-1)?.url ?? `/${page.slug}`;
const parentOf = (page: Page) =>
  typeof page.parent === "object" ? (page.parent?.id ?? null) : (page.parent ?? null);

export function siteNav(pages: readonly Page[], projekte: readonly Projekt[]): NavSection[] {
  const sections = new Map<string, NavSection>();
  for (const page of pages) {
    if (parentOf(page) !== null || !page.slug || HIDDEN.has(page.slug)) continue;
    sections.set(page.slug, {
      label: page.title,
      href: urlOf(page),
      children: pages
        .filter((child) => parentOf(child) === page.id)
        .map((child) => ({ label: child.title, href: urlOf(child) })),
    });
  }
  sections.set("projekte", {
    label: "Projekte",
    href: "/projekte",
    children: projekte
      .filter((p) => p.slug)
      .map((p) => ({ label: p.title, href: `/projekte/${p.slug}` })),
  });

  const rank = (slug: string) => (ORDER.includes(slug) ? ORDER.indexOf(slug) : ORDER.length);
  const ordered = [...sections.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([, section]) => section);
  return [...ordered, { label: "Kontakt", href: "/kontakt", children: [] }];
}
