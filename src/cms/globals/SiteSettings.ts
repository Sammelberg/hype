import type { Field, GlobalConfig } from "payload";

import { revalidateEverything } from "../hooks/revalidate";

const titleAndText: Field[] = [
  { name: "title", label: "Titel", type: "text", required: true },
  { name: "text", label: "Text", type: "textarea", required: true },
];

// Tabs without a name only group the form; the stored shape stays flat. The texts' default values
// are the current copy, so an existing database gets them when the columns are added.
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Website-Einstellungen",
  access: { read: () => true },
  hooks: { afterChange: [revalidateEverything] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Allgemein",
          fields: [
            { name: "siteName", label: "Name der Website", type: "text", required: true },
            {
              name: "ownerName",
              label: "Inhaber (Person oder Firma)",
              type: "text",
              required: true,
            },
            {
              name: "tagline",
              label: "Untertitel",
              type: "text",
              admin: { description: "Im Fußbereich unter dem Namen." },
            },
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
              name: "cta",
              label: "Anfrage",
              type: "group",
              admin: {
                description:
                  "Abschluss am Ende der Startseite und der Inhaltsseiten; die Beschriftung gilt auch für den Aufruf oben auf der Startseite.",
              },
              fields: [
                {
                  name: "title",
                  label: "Überschrift",
                  type: "text",
                  required: true,
                  defaultValue: "Erzählen Sie uns von Ihrem Vorhaben.",
                },
                {
                  name: "text",
                  label: "Text",
                  type: "textarea",
                  defaultValue:
                    "Wir melden uns mit einer ersten Einschätzung und einem Vorschlag für das weitere Vorgehen.",
                },
                {
                  name: "label",
                  label: "Beschriftung der Schaltfläche",
                  type: "text",
                  required: true,
                  defaultValue: "Projekt anfragen",
                  admin: { description: "Führt immer zu /kontakt." },
                },
              ],
            },
          ],
        },
        {
          label: "Startseite",
          fields: [
            {
              name: "hero",
              label: "Kopfbereich (Startseite)",
              type: "group",
              admin: {
                description:
                  "Überschrift: Anfang, wechselndes Wort, Ende — z. B. „Wir entwickeln | mobile Apps | für den Mittelstand.“ Der erste Buchstabe erscheint in gebrochener Schrift.",
              },
              fields: [
                {
                  name: "headline",
                  label: "Überschrift, Anfang",
                  type: "text",
                  required: true,
                  defaultValue: "Wir entwickeln",
                },
                {
                  name: "words",
                  label: "Wechselnde Wörter",
                  type: "array",
                  minRows: 1,
                  labels: { singular: "Wort", plural: "Wörter" },
                  fields: [{ name: "word", label: "Wort", type: "text", required: true }],
                },
                {
                  name: "headlineEnd",
                  label: "Überschrift, Ende",
                  type: "text",
                  required: true,
                  defaultValue: "für den Mittelstand.",
                },
                {
                  name: "lead",
                  label: "Zeile darunter",
                  type: "text",
                  defaultValue: "Individuelle Software aus dem Schwarzwald.",
                },
              ],
            },
            {
              name: "servicesTitle",
              label: "Überschrift Leistungen (Startseite)",
              type: "text",
              required: true,
              defaultValue: "Was wir entwickeln",
            },
            {
              name: "servicesIntro",
              label: "Einleitung Leistungen",
              type: "textarea",
              defaultValue:
                "Von der einzelnen Schnittstelle bis zur kompletten Plattform – geplant für Ihre Abläufe, nicht für einen Standardfall.",
              admin: {
                description: "Unter der Überschrift auf der Startseite und auf /leistungen.",
              },
            },
            {
              name: "services",
              label: "Leistungen (Startseite)",
              type: "array",
              admin: {
                description: "Abschnitt „Was wir entwickeln“ auf der Startseite und /leistungen.",
              },
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
                    description:
                      "Fest gezeichnetes Symbol — es gibt genau diese fünf, keine weiteren.",
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
              name: "stepsTitle",
              label: "Überschrift Vorgehen (Startseite)",
              type: "text",
              required: true,
              defaultValue: "So arbeiten wir",
            },
            {
              name: "steps",
              label: "Vorgehen-Schritte (Startseite)",
              type: "array",
              admin: { description: "Abschnitt „So arbeiten wir“ auf der Startseite." },
              fields: titleAndText,
            },
            {
              name: "principlesTitle",
              label: "Überschrift Grundsätze (Startseite)",
              type: "text",
              required: true,
              defaultValue: "Unsere Grundsätze",
            },
            {
              name: "principles",
              label: "Grundsätze (Startseite)",
              type: "array",
              admin: { description: "Abschnitt „Unsere Grundsätze“ auf der Startseite." },
              fields: titleAndText,
            },
          ],
        },
        {
          label: "Leistungen",
          fields: [
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
        },
        {
          label: "Projekte & Kontakt",
          fields: [
            {
              name: "projekteLead",
              label: "Einleitung Projekte",
              type: "textarea",
              defaultValue:
                "Ausgewählte Projekte, die wir für unsere Kundinnen und Kunden gebaut haben.",
              admin: { description: "Neben der Überschrift auf /projekte." },
            },
            {
              name: "projekteEmpty",
              label: "Text ohne Projekte",
              type: "text",
              defaultValue: "Hier stellen wir bald unsere ersten Projekte vor.",
              admin: {
                description: "Steht auf /projekte, solange kein Projekt veröffentlicht ist.",
              },
            },
            {
              name: "kontaktLead",
              label: "Einleitung Kontakt",
              type: "textarea",
              defaultValue:
                "Erzählen Sie uns von Ihrem Vorhaben. Wir melden uns mit einer ersten Einschätzung und einem Vorschlag für das weitere Vorgehen.",
              admin: { description: "Neben der Überschrift auf /kontakt." },
            },
            {
              name: "kontaktNext",
              label: "Was danach passiert (Kontakt)",
              type: "group",
              admin: { description: "Randspalte auf /kontakt neben dem Formular." },
              fields: [
                {
                  name: "title",
                  label: "Überschrift",
                  type: "text",
                  defaultValue: "Was danach passiert",
                },
                { name: "text", label: "Text", type: "richText" },
              ],
            },
          ],
        },
      ],
    },
  ],
};
