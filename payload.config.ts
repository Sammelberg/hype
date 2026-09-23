import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { searchPlugin } from "@payloadcms/plugin-search";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { de } from "@payloadcms/translations/languages/de";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Media } from "./collections/Media";
import { Pages, pagePath } from "./collections/Pages";
import { Projects, projectPath } from "./collections/Projects";
import { Users } from "./collections/Users";
import { env } from "./env";
import { SiteSettings } from "./globals/SiteSettings";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const s3Enabled = Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);

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
  db: postgresAdapter({ pool: { connectionString: env.DATABASE_URL } }),
  sharp,
  plugins: [
    seoPlugin({
      collections: ["projects", "pages"],
      uploadsCollection: "media",
      tabbedUI: true,
      generateTitle: ({ doc }) => (doc?.title ? String(doc.title) : ""),
    }),
    nestedDocsPlugin({
      collections: ["pages"],
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ""),
    }),
    redirectsPlugin({ collections: ["pages", "projects"] }),
    searchPlugin({ collections: ["projects", "pages"] }),
    formBuilderPlugin({ fields: { payment: false } }),
    s3Storage({
      enabled: s3Enabled,
      collections: { media: true },
      bucket: env.S3_BUCKET ?? "",
      config: {
        region: env.S3_REGION ?? "auto",
        ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID ?? "",
          secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? "",
        },
      },
    }),
  ],
});
