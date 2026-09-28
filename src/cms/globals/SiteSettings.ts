import type { GlobalConfig } from "payload";

import { revalidateEverything } from "../hooks/revalidate";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Website-Einstellungen",
  access: { read: () => true },
  hooks: { afterChange: [revalidateEverything] },
  fields: [
    { name: "siteName", label: "Name der Website", type: "text", required: true },
    { name: "ownerName", label: "Inhaber (Person oder Firma)", type: "text", required: true },
    { name: "tagline", label: "Untertitel", type: "text" },
    {
      name: "description",
      label: "Standard-Beschreibung (SEO)",
      type: "textarea",
      maxLength: 160,
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
      name: "services",
      label: "Leistungen (Startseite)",
      type: "array",
      admin: { description: "Abschnitt „Was wir entwickeln“ auf der Startseite und /leistungen." },
      fields: [
        { name: "title", label: "Titel", type: "text", required: true },
        {
          name: "short",
          label: "Kurzname",
          type: "text",
          required: true,
          admin: { description: "Für die Leiste (schmale Bildschirme, Navigation)." },
        },
        {
          name: "slug",
          label: "URL-Kürzel",
          type: "text",
          required: true,
          admin: { description: "Ergibt /leistungen/<kürzel>." },
          validate: (value: unknown) =>
            typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
              ? true
              : "Nur Kleinbuchstaben, Ziffern und Bindestriche.",
        },
        {
          name: "glyph",
          label: "Symbol",
          type: "select",
          required: true,
          admin: {
            description: "Fest gezeichnetes Symbol — es gibt genau diese fünf, keine weiteren.",
          },
          options: [
            { label: "Web", value: "web" },
            { label: "Mobile", value: "mobile" },
            { label: "Integration", value: "integration" },
            { label: "Modernisierung", value: "modernisation" },
            { label: "Betrieb", value: "operations" },
          ],
        },
        { name: "text", label: "Text", type: "textarea", required: true },
        {
          name: "examples",
          label: "Beispiele",
          type: "array",
          fields: [{ name: "text", label: "Text", type: "text", required: true }],
        },
      ],
    },
    {
      name: "steps",
      label: "Vorgehen-Schritte (Startseite)",
      type: "array",
      admin: { description: "Abschnitt „So arbeiten wir“ auf der Startseite." },
      fields: [
        { name: "title", label: "Titel", type: "text", required: true },
        { name: "text", label: "Text", type: "textarea", required: true },
      ],
    },
    {
      name: "principles",
      label: "Grundsätze (Startseite)",
      type: "array",
      admin: { description: "Abschnitt „Unsere Grundsätze“ auf der Startseite." },
      fields: [
        { name: "title", label: "Titel", type: "text", required: true },
        { name: "text", label: "Text", type: "textarea", required: true },
      ],
    },
    {
      name: "faq",
      label: "FAQ",
      type: "array",
      admin: { description: "Häufige Fragen auf /leistungen." },
      fields: [
        { name: "question", label: "Frage", type: "text", required: true },
        { name: "answer", label: "Antwort", type: "textarea", required: true },
      ],
    },
  ],
};
