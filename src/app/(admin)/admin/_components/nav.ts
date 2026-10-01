import {
  AlarmClockIcon,
  ArrowRightLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarDaysIcon,
  ContactIcon,
  FileSignatureIcon,
  ReceiptIcon,
  ScrollTextIcon,
  FileTextIcon,
  FileUserIcon,
  FolderKanbanIcon,
  ImageIcon,
  LandmarkIcon,
  ListChecksIcon,
  InboxIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  MailIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; keywords?: string };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV_HOME: NavItem = {
  href: "/admin",
  label: "Übersicht",
  icon: LayoutDashboardIcon,
  keywords: "dashboard start",
};

// The sidebar in the order of the owner's week: the site's content, the customers and what they
// commissioned, the money, and what runs underneath. Every text of a page is edited on that page
// (Seiten); „Website“ holds only what all pages share.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Inhalte",
    items: [
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
      {
        href: "/admin/medien",
        label: "Medien",
        icon: ImageIcon,
        keywords: "bilder uploads dateien",
      },
    ],
  },
  {
    // Who the customers are, what they commissioned and what is agreed.
    label: "Vertrieb",
    items: [
      {
        href: "/admin/kunden",
        label: "Kunden",
        icon: ContactIcon,
        keywords: "kundenkarte crm firmen",
      },
      {
        href: "/admin/angebote",
        label: "Angebote",
        icon: FileUserIcon,
        keywords: "angebot kostenvoranschlag zusage",
      },
      {
        href: "/admin/auftraege",
        label: "Aufträge",
        icon: BriefcaseIcon,
        keywords: "projekte bestellungen",
      },
      {
        href: "/admin/vertraege",
        label: "Verträge",
        icon: FileSignatureIcon,
        keywords: "kündigung laufzeit wartung abo",
      },
      {
        href: "/admin/kalender",
        label: "Kalender",
        icon: CalendarDaysIcon,
        keywords: "termine ereignisse fristen woche monat",
      },
      {
        href: "/admin/wiedervorlagen",
        label: "Wiedervorlagen",
        icon: AlarmClockIcon,
        keywords: "erinnerung aufgaben nachfassen termine",
      },
    ],
  },
  {
    // What is billed, what came in, what the tax adviser gets.
    label: "Finanzen",
    items: [
      {
        href: "/admin/rechnungen",
        label: "Rechnungen",
        icon: ReceiptIcon,
        keywords: "e-rechnung xrechnung storno bezahlt abschlag schlussrechnung",
      },
      {
        href: "/admin/offene-posten",
        label: "Offene Posten",
        icon: ListChecksIcon,
        keywords: "mahnung zahlung überfällig forderungen",
      },
      {
        href: "/admin/steuerberater",
        label: "Steuerberater",
        icon: LandmarkIcon,
        keywords: "datev export umsatzsteuer voranmeldung journal csv",
      },
    ],
  },
  {
    label: "Einstellungen",
    items: [
      {
        href: "/admin/einstellungen",
        label: "Website",
        icon: SettingsIcon,
        keywords: "einstellungen name fußbereich kontakt e-mail abschluss",
      },
      {
        href: "/admin/firma",
        label: "Firmendaten",
        icon: BuildingIcon,
        keywords: "steuernummer iban bank kleinunternehmer",
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
      {
        href: "/admin/protokoll",
        label: "Protokoll",
        icon: ScrollTextIcon,
        keywords: "audit log anmeldungen änderungen verlauf",
      },
    ],
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

export const NAV_ALL: NavItem[] = [NAV_HOME, ...NAV_GROUPS.flatMap((g) => g.items), ...NAV_MORE];

export const isActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
