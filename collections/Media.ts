import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  access: { read: () => true },
  fields: [{ name: "alt", type: "text", required: true }],
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
