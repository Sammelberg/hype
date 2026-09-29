// Main navigation in the header. The site name already links home; the first two jump to sections
// of the home page and give way to the contact link on narrow screens.
export const MENU_LINKS = [
  { href: "/leistungen", label: "Leistungen", wide: true },
  { href: "/#vorgehen", label: "Vorgehen", wide: true },
  { href: "/projekte", label: "Projekte", wide: true },
  { href: "/kontakt", label: "Kontakt", wide: false },
] as const;

// The whole site by topic, for the phone menu and the footer: pages the header has no room for
// (Branchen, Über uns) are reachable from here.
export const SITE_GROUPS = [
  {
    label: "Angebot",
    links: [
      { href: "/leistungen", label: "Leistungen" },
      { href: "/branchen", label: "Branchen" },
      { href: "/projekte", label: "Projekte" },
    ],
  },
  {
    label: "Unternehmen",
    links: [
      { href: "/ueber-uns", label: "Über uns" },
      { href: "/ueber-uns/arbeitsweise", label: "Arbeitsweise" },
      { href: "/kontakt", label: "Kontakt" },
    ],
  },
] as const;
