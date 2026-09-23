import type { CollectionConfig } from "payload";

import { revalidateCollection } from "../hooks/revalidate";

type Breadcrumb = { url?: string | null };

// nested-docs stores the full path in the last breadcrumb (e.g. /ueber-mich/lebenslauf).
export const pagePath = (doc: Record<string, unknown>) => {
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
    description: "Pflichtseiten: „impressum“ und „datenschutz“ (URL-Kürzel).",
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
    { name: "content", label: "Inhalt", type: "richText" },
  ],
};
