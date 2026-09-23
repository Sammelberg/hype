import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { de } from "@payloadcms/translations/languages/de";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Media } from "./cms/collections/Media";
import { Pages, pagePath } from "./cms/collections/Pages";
import { Projects, projectPath } from "./cms/collections/Projects";
import { Users } from "./cms/collections/Users";
import { SiteSettings } from "./cms/globals/SiteSettings";
import { plugins } from "./cms/plugins";
import { env } from "./env";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  serverURL: env.NEXT_PUBLIC_SERVER_URL,
  // Data sovereignty: no usage telemetry to payloadcms.com, no Gravatar lookups (leaks email hashes).
  telemetry: false,
  admin: {
    user: Users.slug,
    avatar: "default",
    importMap: { baseDir: dirname },
    livePreview: {
      // Goes through /next/preview, which checks the Payload session and enables Next draft mode.
      url: ({ data, collectionConfig }) => {
        const path =
          collectionConfig?.slug === "projects" ? projectPath(data?.slug) : pagePath(data ?? {});
        return `${env.NEXT_PUBLIC_SERVER_URL}/next/preview?path=${encodeURIComponent(path ?? "/")}`;
      },
      collections: ["projects", "pages"],
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 390, height: 844 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  i18n: { supportedLanguages: { de }, fallbackLanguage: "de" },
  collections: [Users, Media, Projects, Pages],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL },
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  sharp,
  plugins,
});
