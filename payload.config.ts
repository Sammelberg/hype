import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { searchPlugin } from "@payloadcms/plugin-search";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { Projects } from "./collections/Projects";
import { Users } from "./collections/Users";
import { env } from "./env";

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
      url: ({ data, collectionConfig }) =>
        `${env.NEXT_PUBLIC_SERVER_URL}/${collectionConfig?.slug === "projects" ? "work/" : ""}${data?.slug ?? ""}`,
      collections: ["projects", "pages"],
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 390, height: 844 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  collections: [Users, Media, Projects, Pages],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({ pool: { connectionString: env.DATABASE_URL } }),
  sharp,
  ...(env.RESEND_API_KEY && env.EMAIL_FROM
    ? {
        email: resendAdapter({
          apiKey: env.RESEND_API_KEY,
          defaultFromAddress: env.EMAIL_FROM,
          defaultFromName: "Portfolio",
        }),
      }
    : {}),
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
