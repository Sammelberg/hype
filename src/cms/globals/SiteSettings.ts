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
  ],
};
