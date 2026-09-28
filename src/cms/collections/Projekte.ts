import type { CollectionConfig } from "payload";

import { revalidateCollection } from "../hooks/revalidate";

export const projektPath = (doc: Record<string, unknown>) =>
  doc.slug ? `/projekte/${String(doc.slug)}` : null;

const revalidate = revalidateCollection(projektPath);

export const Projekte: CollectionConfig = {
  slug: "projekte",
  labels: { singular: "Projekt", plural: "Projekte" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "kunde", "_status", "updatedAt"],
    description: "Referenzprojekte für die Seite „Projekte“.",
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
    { name: "kunde", label: "Kunde", type: "text", required: true },
    {
      name: "summary",
      label: "Kurztext",
      type: "textarea",
      required: true,
      admin: { description: "Für die Projektübersicht und den Suchindex." },
    },
    { name: "content", label: "Inhalt", type: "richText", required: true },
  ],
};
