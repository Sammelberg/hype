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
import { revalidatePathsOf } from "./hooks/revalidate";
import { normalizePath } from "./lib/redirects";
import { SiteSettings } from "./globals/SiteSettings";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const redirectRevalidation = revalidatePathsOf((doc) => [doc.from ? String(doc.from) : null]);
const formRevalidation = revalidatePathsOf(() => ["/kontakt"]);

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
    // Resolved in the frontend before a 404 (lib/queries.ts → findRedirect).
    redirectsPlugin({
      collections: ["pages", "projects"],
      redirectTypes: ["301", "302"],
      redirectTypeFieldOverride: {
        label: "Art",
        defaultValue: "301",
        options: [
          { label: "301 – dauerhaft (Adresse hat sich geändert)", value: "301" },
          { label: "302 – vorübergehend", value: "302" },
        ],
      },
      overrides: {
        labels: { singular: "Weiterleitung", plural: "Weiterleitungen" },
        hooks: {
          beforeChange: [
            ({ data }) => (data.from ? { ...data, from: normalizePath(String(data.from)) } : data),
          ],
          afterChange: [redirectRevalidation.afterChange],
          afterDelete: [redirectRevalidation.afterDelete],
        },
      },
    }),
    // Feeds /suche. Only published documents are indexed.
    searchPlugin({
      collections: ["projects", "pages"],
      searchOverrides: {
        labels: { singular: "Suchindex-Eintrag", plural: "Suchindex" },
        fields: ({ defaultFields }) => [
          ...defaultFields,
          { name: "summary", label: "Kurztext", type: "textarea", admin: { readOnly: true } },
          { name: "url", label: "Pfad", type: "text", admin: { readOnly: true } },
        ],
      },
      beforeSync: ({ collectionSlug, originalDoc, searchDoc }) => ({
        ...searchDoc,
        summary: originalDoc.summary ?? originalDoc.meta?.description ?? "",
        url: collectionSlug === "projects" ? projectPath(originalDoc.slug) : pagePath(originalDoc),
      }),
    }),
    // Contact form at /kontakt. No email adapter (data sovereignty): submissions are read in the
    // admin, so the plugin's email settings are removed. Public REST creation is closed — the
    // site's server action validates, checks the honeypot and writes via the Local API.
    formBuilderPlugin({
      fields: { payment: false, country: false, state: false },
      formOverrides: {
        labels: { singular: "Formular", plural: "Formulare" },
        fields: ({ defaultFields }) =>
          defaultFields.filter((field) => !("name" in field && field.name === "emails")),
        hooks: {
          afterChange: [formRevalidation.afterChange],
          afterDelete: [formRevalidation.afterDelete],
        },
      },
      formSubmissionOverrides: {
        labels: { singular: "Formulareingang", plural: "Formulareingänge" },
        access: {
          create: ({ req }) => Boolean(req.user),
          read: ({ req }) => Boolean(req.user),
          update: () => false,
          delete: ({ req }) => Boolean(req.user),
        },
        admin: { defaultColumns: ["form", "createdAt"] },
      },
    }),
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
