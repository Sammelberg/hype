import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { searchPlugin } from "@payloadcms/plugin-search";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { s3Storage } from "@payloadcms/storage-s3";
import type { Plugin } from "payload";

import { env } from "../env";
import { normalizePath } from "../lib/redirects";
import { firstParagraph, plainText } from "../lib/rich-text";
import { revalidatePathsOf } from "./hooks/revalidate";
import { docPath, ROUTED_COLLECTIONS } from "./paths";

const redirectRevalidation = revalidatePathsOf((doc) => [doc.from ? String(doc.from) : null]);
const formRevalidation = revalidatePathsOf(() => ["/kontakt"]);

const s3Enabled = Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);

export const plugins: Plugin[] = [
  seoPlugin({
    collections: ROUTED_COLLECTIONS,
    uploadsCollection: "media",
    tabbedUI: true,
    generateTitle: ({ doc }) => (doc?.title ? String(doc.title) : ""),
  }),
  nestedDocsPlugin({
    collections: ["pages"],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ""),
  }),
  // Resolved in the frontend before a 404 (src/data/queries.ts → findRedirect).
  redirectsPlugin({
    collections: ROUTED_COLLECTIONS,
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
    collections: ROUTED_COLLECTIONS,
    searchOverrides: {
      labels: { singular: "Suchindex-Eintrag", plural: "Suchindex" },
      fields: ({ defaultFields }) => [
        ...defaultFields,
        { name: "summary", label: "Kurztext", type: "textarea", admin: { readOnly: true } },
        { name: "url", label: "Pfad", type: "text", admin: { readOnly: true } },
        // The whole text of the page, so the site search finds words from anywhere in it.
        { name: "text", label: "Volltext", type: "textarea", admin: { hidden: true } },
      ],
    },
    beforeSync: ({ collectionSlug, originalDoc, searchDoc }) => ({
      ...searchDoc,
      summary:
        originalDoc.summary ??
        originalDoc.lead ??
        originalDoc.meta?.description ??
        firstParagraph(originalDoc.content) ??
        "",
      text: plainText(originalDoc.content),
      url: docPath(collectionSlug, originalDoc),
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
];
