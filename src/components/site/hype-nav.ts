import type { NavSection } from "@/lib/site-nav";

// The site's sections as Hype Agency shows them: the catalogue and the prices first (literal routes,
// not CMS pages), then the CMS pages. kern's „Projekte“ has no place on a party site.
const VORNE: NavSection[] = [
  {
    label: "Figuren",
    href: "/figuren",
    description: "Wer zur Feier kommt: Prinzessinnen, Helden, Tiere und mehr.",
    children: [],
  },
  {
    label: "Preise",
    href: "/preise",
    description: "Pakete, Extras und Anfahrt, alles Endpreise.",
    children: [],
  },
];

export const hypeNav = (sections: NavSection[]): NavSection[] => [
  ...VORNE,
  ...sections.filter((s) => s.href !== "/projekte"),
];

// The footer adds the towns with a landing page of their own, so each is linked from every page.
export const hypeFussNav = (
  sections: NavSection[],
  orte: { name: string; slug: string; seite: boolean }[],
): NavSection[] => {
  const seiten = orte.filter((o) => o.seite);
  const nav = hypeNav(sections);
  if (seiten.length === 0) return nav;
  return [
    ...nav,
    {
      label: "Orte",
      href: "/preise#anfahrt-titel",
      description: "Wohin wir kommen und was die Anfahrt kostet.",
      children: seiten.map((o) => ({
        label: `Kindergeburtstag in ${o.name}`,
        href: `/kindergeburtstag/${o.slug}`,
      })),
    },
  ];
};
