import type { GlobalConfig } from "payload";

import { revalidateEverything } from "../hooks/revalidate";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Website-Einstellungen",
  access: { read: () => true },
  hooks: { afterChange: [revalidateEverything] },
  fields: [
    { name: "siteName", label: "Name der Website", type: "text", required: true },
    { name: "ownerName", label: "Name (Person)", type: "text", required: true },
    { name: "tagline", label: "Untertitel", type: "text" },
    {
      name: "description",
      label: "Standard-Beschreibung (SEO)",
      type: "textarea",
      maxLength: 160,
    },
    {
      name: "hero",
      label: "Einstieg (Startseite)",
      type: "group",
      admin: {
        description:
          "Der erste Bildschirm: Textkarte links, Showreel rechts, darunter zwei gleich breite Link-Karten. Leere Felder fallen auf Name und Untertitel zurück.",
      },
      fields: [
        {
          name: "eyebrow",
          label: "Kennzeile",
          type: "text",
          admin: { description: "Kurz, z. B. Ort und Arbeitsfelder." },
        },
        {
          name: "headline",
          label: "Titel",
          type: "textarea",
          admin: {
            description:
              "Jede Zeile wird eine Zeile im Titel. Ein Punkt am Ende erscheint in der Akzentfarbe.",
          },
        },
        { name: "intro", label: "Einleitung", type: "textarea" },
        {
          name: "links",
          label: "Link-Karten",
          type: "array",
          maxRows: 2,
          admin: {
            description: "Beide Karten stehen gleichwertig nebeneinander.",
          },
          fields: [
            { name: "label", label: "Text", type: "text", required: true },
            {
              name: "href",
              label: "Ziel",
              type: "text",
              required: true,
              admin: { description: "Interner Pfad, z. B. /#projekte oder /kontakt." },
            },
          ],
        },
      ],
    },
    { name: "contactEmail", label: "Kontakt-E-Mail (öffentlich)", type: "email" },
    {
      name: "socialLinks",
      label: "Profile",
      type: "array",
      fields: [
        { name: "label", label: "Bezeichnung", type: "text", required: true },
        { name: "url", label: "URL", type: "text", required: true },
      ],
    },
    {
      name: "clients",
      label: "Kunden (Startseite)",
      type: "array",
      admin: {
        description:
          "Abschnitt „Kunden“: laufendes Logo-Band unter dem Einstieg. Logos als weiße Grafik mit transparentem Hintergrund (PNG, WebP oder SVG).",
      },
      fields: [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "logo", label: "Logo", type: "upload", relationTo: "media", required: true },
      ],
    },
    {
      name: "services",
      label: "Leistungen (Startseite)",
      type: "array",
      admin: { description: "Was Sie anbieten. Erscheint als Abschnitt „Leistungen“." },
      fields: [
        { name: "title", label: "Titel", type: "text", required: true },
        { name: "description", label: "Beschreibung", type: "textarea", required: true },
      ],
    },
    {
      name: "manifesto",
      label: "Manifest (Startseite)",
      type: "group",
      admin: {
        description:
          "Bildschirmfüllende Sätze, die beim Scrollen nacheinander erscheinen. Ohne Sätze entfällt der Abschnitt.",
      },
      fields: [
        {
          name: "phrases",
          label: "Sätze",
          type: "array",
          labels: { singular: "Satz", plural: "Sätze" },
          fields: [{ name: "text", label: "Text", type: "text", required: true }],
        },
        { name: "caption", label: "Unterzeile", type: "text" },
      ],
    },
    {
      name: "faq",
      label: "Häufige Fragen (Startseite)",
      type: "array",
      admin: { description: "Fragen, die Interessierte oft stellen. Abschnitt „Häufige Fragen“." },
      fields: [
        { name: "question", label: "Frage", type: "text", required: true },
        { name: "answer", label: "Antwort", type: "textarea", required: true },
      ],
    },
    {
      name: "process",
      label: "Ablauf (Startseite)",
      type: "array",
      admin: { description: "Die Schritte eines Projekts, in Reihenfolge. Abschnitt „Ablauf“." },
      fields: [
        { name: "title", label: "Titel", type: "text", required: true },
        { name: "description", label: "Beschreibung", type: "textarea", required: true },
      ],
    },
  ],
};
