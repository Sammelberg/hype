import type { CollectionConfig } from "payload";

export const Projects: CollectionConfig = {
  slug: "projects",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "year", "_status", "updatedAt"],
  },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: "published" } }),
  },
  versions: { drafts: { autosave: true } },
  defaultSort: "-year",
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { position: "sidebar" },
    },
    { name: "summary", type: "textarea", required: true, maxLength: 280 },
    { name: "cover", type: "upload", relationTo: "media", required: true },
    { name: "year", type: "number", required: true, admin: { position: "sidebar" } },
    { name: "role", type: "text", admin: { position: "sidebar" } },
    { name: "client", type: "text", admin: { position: "sidebar" } },
    { name: "url", type: "text", admin: { position: "sidebar" } },
    {
      name: "tags",
      type: "text",
      hasMany: true,
      admin: { position: "sidebar" },
    },
    { name: "featured", type: "checkbox", defaultValue: false, admin: { position: "sidebar" } },
    { name: "content", type: "richText" },
    {
      name: "gallery",
      type: "upload",
      relationTo: "media",
      hasMany: true,
    },
  ],
};
