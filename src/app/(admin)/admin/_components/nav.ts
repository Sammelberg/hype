import {
  ArrowRightLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  ContactIcon,
  FileSignatureIcon,
  ReceiptIcon,
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

// Two groups: what the owner touches every week, and what runs the site underneath. Every text
// of a page is edited on that page (Seiten); „Website“ holds only what all pages share.
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

// The office: who the customers are, what they commissioned, what is agreed, what is billed.
export const NAV_BUERO: NavItem[] = [
  { href: "/admin/kunden", label: "Kunden", icon: ContactIcon, keywords: "kundenkarte crm firmen" },
  {
    href: "/admin/auftraege",
    label: "Aufträge",
    icon: BriefcaseIcon,
    keywords: "angebote bestellungen",
  },
  {
    href: "/admin/vertraege",
    label: "Verträge",
    icon: FileSignatureIcon,
    keywords: "kündigung laufzeit wartung",
  },
  {
    href: "/admin/rechnungen",
    label: "Rechnungen",
    icon: ReceiptIcon,
    keywords: "e-rechnung xrechnung storno bezahlt",
  },
  {
    href: "/admin/firma",
    label: "Firmendaten",
    icon: BuildingIcon,
    keywords: "steuernummer iban bank kleinunternehmer",
  },
];

export const NAV_SITE: NavItem[] = [
  {
    href: "/admin/einstellungen",
    label: "Website",
    icon: SettingsIcon,
    keywords: "einstellungen name fußbereich kontakt e-mail abschluss",
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

// Reached from its page (Seiten → Kontakt), not from the sidebar; the palette still finds it.
export const NAV_MORE: NavItem[] = [
  {
    href: "/admin/formular",
    label: "Kontaktformular",
    icon: MailIcon,
    keywords: "felder formular kontakt",
  },
];

export const isActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
