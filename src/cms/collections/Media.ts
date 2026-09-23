import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Medium", plural: "Medien" },
  access: { read: () => true },
  fields: [
    {
      name: "alt",
      label: "Alternativtext",
      type: "text",
      required: true,
      admin: { description: "Beschreibt das Bild für Screenreader und Suchmaschinen." },
    },
  ],
  upload: {
    mimeTypes: ["image/*", "video/mp4", "video/webm"],
    imageSizes: [
      { name: "thumbnail", width: 480 },
      { name: "card", width: 960 },
      { name: "hero", width: 1920 },
    ],
    focalPoint: true,
  },
};
