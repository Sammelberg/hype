// Main navigation in the header. The site name already links home; the first two jump to sections
// of the home page and give way to the contact link on narrow screens.
export const MENU_LINKS = [
  { href: "/#leistungen", label: "Leistungen", wide: true },
  { href: "/#vorgehen", label: "Vorgehen", wide: true },
  { href: "/kontakt", label: "Kontakt", wide: false },
] as const;
