import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Benutzer", plural: "Benutzer" },
  admin: { useAsTitle: "email" },
  auth: true,
  fields: [{ name: "name", label: "Name", type: "text" }],
};
