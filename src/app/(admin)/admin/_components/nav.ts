import {
  ArrowRightLeftIcon,
  FileTextIcon,
  FolderKanbanIcon,
  ImageIcon,
  InboxIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  MailIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; keywords?: string };

// Two groups: what the owner touches every week, and what runs the site underneath.
export const NAV_CONTENT: NavItem[] = [
  { href: "/admin", label: "Übersicht", icon: LayoutDashboardIcon, keywords: "dashboard start" },
  { href: "/admin/seiten", label: "Seiten", icon: FileTextIcon, keywords: "pages inhalt" },
  {
    href: "/admin/projekte",
    label: "Projekte",
    icon: FolderKanbanIcon,
    keywords: "referenzen kunden",
  },
  {
    href: "/admin/anfragen",
    label: "Anfragen",
    icon: InboxIcon,
    keywords: "nachrichten kontakt eingang",
  },
  { href: "/admin/medien", label: "Medien", icon: ImageIcon, keywords: "bilder uploads dateien" },
];

export const NAV_SITE: NavItem[] = [
  {
    href: "/admin/einstellungen",
    label: "Website",
    icon: SettingsIcon,
    keywords: "einstellungen texte startseite",
  },
  {
    href: "/admin/formular",
    label: "Kontaktformular",
    icon: MailIcon,
    keywords: "felder formular",
  },
  {
    href: "/admin/weiterleitungen",
    label: "Weiterleitungen",
    icon: ArrowRightLeftIcon,
    keywords: "redirects urls",
  },
  {
    href: "/admin/benutzer",
    label: "Benutzer",
    icon: UsersIcon,
    keywords: "zugänge konten passwort",
  },
];

export const isActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
