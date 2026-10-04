// What an account may do. Pure and without imports: the admin's client components show and hide
// by it, the server enforces it (requireRole, adminActionClient).
//   admin      everything: pages, projects, media, the site, the inbox, accounts, the office, the log
//   redakteur  the site's content: pages, projects, media, Website, form, redirects, inbox
export const ROLES = ["admin", "redakteur"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, { name: string; hint: string }> = {
  admin: { name: "Admin", hint: "Alles, auch Zugänge, Büro und Protokoll." },
  redakteur: {
    name: "Redaktion",
    hint: "Seiten, Projekte, Medien, Website, Weiterleitungen und Anfragen.",
  },
};

export const isAdmin = (user: { role: Role }) => user.role === "admin";

// Admin-only areas below /admin, by path prefix. The pages check on their own; this list only
// decides what the navigation shows.
export const ADMIN_ONLY = [
  "/admin/buchung",
  "/admin/kunden",
  "/admin/angebote",
  "/admin/auftraege",
  "/admin/vertraege",
  "/admin/rechnungen",
  "/admin/wiedervorlagen",
  "/admin/kalender",
  "/admin/offene-posten",
  "/admin/steuerberater",
  "/admin/firma",
  "/admin/email-versand",
  "/admin/benutzer",
  "/admin/protokoll",
  "/admin/druck",
];

export const mayOpen = (role: Role, href: string) =>
  role === "admin" ||
  !ADMIN_ONLY.some((prefix) => href === prefix || href.startsWith(`${prefix}/`));
