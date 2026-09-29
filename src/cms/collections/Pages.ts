import type { CollectionConfig } from "payload";

import { revalidateCollection } from "../hooks/revalidate";

type Breadcrumb = { url?: string | null };

// The page with this slug is the home page and lives at `/`, not at /startseite.
export const HOME_SLUG = "startseite";

// nested-docs stores the full path in the last breadcrumb (e.g. /ueber-uns/team).
export const pagePath = (doc: Record<string, unknown>) => {
  if (doc.slug === HOME_SLUG) return "/";
  const crumbs = doc.breadcrumbs as Breadcrumb[] | undefined;
  return crumbs?.at(-1)?.url ?? (doc.slug ? `/${String(doc.slug)}` : null);
};

const revalidate = revalidateCollection(pagePath);

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Seite", plural: "Seiten" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description:
      "Sonderseiten (URL-Kürzel): „startseite“ ist die Startseite, „impressum“ und „datenschutz“ sind Pflicht.",
  },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: "published" } }),
  },
  versions: { drafts: { autosave: true } },
  hooks: { afterChange: [revalidate.afterChange], afterDelete: [revalidate.afterDelete] },
  fields: [
    { name: "title", label: "Titel", type: "text", required: true },
    {
      name: "slug",
      label: "URL-Kürzel",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { position: "sidebar" },
      validate: (value: unknown) =>
        typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
          ? true
          : "Nur Kleinbuchstaben, Ziffern und Bindestriche.",
    },
    {
      name: "lead",
      label: "Einleitung",
      type: "textarea",
      admin: {
        description:
          "Ein, zwei Sätze neben der Überschrift. Auch Vorschau in Übersichten und Suche, wenn gesetzt.",
      },
    },
    { name: "content", label: "Inhalt", type: "richText" },
  ],
};
