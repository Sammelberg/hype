import type { CollectionConfig } from "payload";

import { revalidateCollection } from "../hooks/revalidate";

export const projectPath = (slug: unknown) => (slug ? `/projekte/${String(slug)}` : null);

const revalidate = revalidateCollection((doc) => projectPath(doc.slug));

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: { singular: "Projekt", plural: "Projekte" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "year", "_status", "updatedAt"],
  },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: "published" } }),
  },
  versions: { drafts: { autosave: true } },
  defaultSort: "-year",
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
      admin: {
        position: "sidebar",
        description: "Kleinbuchstaben und Bindestriche, z. B. mein-projekt",
      },
      validate: (value: unknown) =>
        typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
          ? true
          : "Nur Kleinbuchstaben, Ziffern und Bindestriche.",
    },
    {
      name: "summary",
      label: "Kurzbeschreibung",
      type: "textarea",
      required: true,
      maxLength: 280,
    },
    { name: "cover", label: "Titelbild", type: "upload", relationTo: "media", required: true },
    { name: "year", label: "Jahr", type: "number", required: true, admin: { position: "sidebar" } },
    { name: "role", label: "Rolle", type: "text", admin: { position: "sidebar" } },
    { name: "client", label: "Kunde", type: "text", admin: { position: "sidebar" } },
    { name: "url", label: "Projekt-URL", type: "text", admin: { position: "sidebar" } },
    { name: "tags", label: "Tags", type: "text", hasMany: true, admin: { position: "sidebar" } },
    {
      name: "featured",
      label: "Hervorgehoben",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    { name: "content", label: "Inhalt", type: "richText" },
    { name: "gallery", label: "Galerie", type: "upload", relationTo: "media", hasMany: true },
  ],
};
