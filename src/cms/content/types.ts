// The document shapes the site reads (src/data/queries.ts) and the admin edits. They keep the
// field names the pages already use, so replacing Payload changed the data layer, not the routes.
import { z } from "zod";

import { type LexicalDocument, LexicalDocumentSchema } from "../rich-text/schema";

export type DocStatus = "draft" | "published";

// ---------------------------------------------------------------------------------------------
// Media

export const MEDIA_SIZES = { thumbnail: 480, card: 960, hero: 1920 } as const;
export type MediaSizeName = keyof typeof MEDIA_SIZES;

export type MediaVariant = { filename: string; width: number; height: number; filesize: number };
export type MediaSizes = Partial<Record<MediaSizeName, MediaVariant>>;

export type MediaDoc = {
  id: number;
  alt: string;
  filename: string;
  mimeType: string;
  filesize: number;
  width: number | null;
  height: number | null;
  focalX: number;
  focalY: number;
  url: string;
  sizes: Partial<Record<MediaSizeName, MediaVariant & { url: string }>>;
  createdAt: Date;
  updatedAt: Date;
};

// ---------------------------------------------------------------------------------------------
// SEO group shared by pages and projects

export const SeoSchema = z.object({
  title: z.string().trim().max(200).nullish(),
  description: z.string().trim().max(500).nullish(),
  imageId: z.number().int().positive().nullish(),
});
export type SeoInput = z.infer<typeof SeoSchema>;

export type Seo = {
  title: string | null;
  description: string | null;
  image: MediaDoc | null;
};

// ---------------------------------------------------------------------------------------------
// Pages

export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MESSAGE = "Nur Kleinbuchstaben, Ziffern und einzelne Bindestriche.";
const slugField = z
  .string()
  .trim()
  .min(1, "Bitte geben Sie einen Pfad an.")
  .max(200)
  .regex(SLUG_REGEX, SLUG_MESSAGE);

export const PageInputSchema = z.object({
  title: z.string().trim().min(1, "Bitte geben Sie einen Titel an.").max(300),
  slug: slugField,
  parentId: z.number().int().positive().nullable(),
  lead: z.string().trim().max(2000).nullable(),
  content: LexicalDocumentSchema.nullable(),
  meta: SeoSchema,
});
export type PageInput = z.infer<typeof PageInputSchema>;

export type Breadcrumb = { label: string; url: string };

export type Page = {
  id: number;
  title: string;
  slug: string;
  path: string;
  parent: number | null;
  lead: string | null;
  content: LexicalDocument | null;
  meta: Seo;
  breadcrumbs: Breadcrumb[];
  status: DocStatus;
  hasDraft: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ---------------------------------------------------------------------------------------------
// Projekte

export const ProjektInputSchema = z.object({
  title: z.string().trim().min(1, "Bitte geben Sie einen Titel an.").max(300),
  slug: slugField,
  kunde: z.string().trim().min(1, "Bitte geben Sie den Kunden an.").max(300),
  summary: z.string().trim().min(1, "Bitte geben Sie eine Kurzbeschreibung an.").max(2000),
  content: LexicalDocumentSchema.nullable(),
  meta: SeoSchema,
});
export type ProjektInput = z.infer<typeof ProjektInputSchema>;

export type Projekt = {
  id: number;
  title: string;
  slug: string;
  path: string;
  kunde: string;
  summary: string;
  content: LexicalDocument | null;
  meta: Seo;
  status: DocStatus;
  hasDraft: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ---------------------------------------------------------------------------------------------
// Site settings: one document, edited in tabs; `id` on list items keeps React keys stable.

export const GLYPHS = ["web", "mobile", "integration", "modernisation", "operations"] as const;
export type Glyph = (typeof GLYPHS)[number];

const item = <T extends z.ZodRawShape>(shape: T) => z.object({ id: z.string().min(1), ...shape });
const required = (what: string) => z.string().trim().min(1, `Bitte füllen Sie ${what} aus.`);
const optionalText = z.string().trim().nullish();

export const SiteSettingsSchema = z.object({
  siteName: required("den Namen der Website"),
  ownerName: required("den Inhaber"),
  tagline: optionalText,
  description: z.string().trim().max(160, "Höchstens 160 Zeichen.").nullish(),
  contactEmail: z.union([z.literal(""), z.email("Bitte eine gültige E-Mail-Adresse.")]).nullish(),
  socialLinks: z.array(
    item({ label: required("die Bezeichnung"), url: z.url("Bitte eine gültige Adresse.") }),
  ),
  cta: z.object({
    title: required("die Überschrift"),
    text: optionalText,
    label: required("die Beschriftung"),
  }),
  hero: z.object({
    headline: required("den Anfang der Überschrift"),
    words: z.array(item({ word: required("das Wort") })).min(1, "Mindestens ein Wort."),
    headlineEnd: required("das Ende der Überschrift"),
    lead: optionalText,
  }),
  servicesTitle: required("die Überschrift"),
  servicesIntro: optionalText,
  services: z
    .array(
      item({
        title: required("den Titel"),
        short: required("die Kurzform"),
        slug: slugField,
        glyph: z.enum(GLYPHS),
        text: required("den Text"),
        examples: z.array(item({ text: required("das Beispiel") })),
      }),
    )
    .length(5, "Es gibt genau fünf Leistungen."),
  stepsTitle: required("die Überschrift"),
  steps: z.array(item({ title: required("den Titel"), text: required("den Text") })),
  principlesTitle: required("die Überschrift"),
  principles: z.array(item({ title: required("den Titel"), text: required("den Text") })),
  faq: z.array(item({ question: required("die Frage"), answer: required("die Antwort") })),
  projekteLead: optionalText,
  projekteEmpty: optionalText,
  kontaktLead: optionalText,
  kontaktNext: z.object({
    title: optionalText,
    text: LexicalDocumentSchema.nullish(),
  }),
});
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

// ---------------------------------------------------------------------------------------------
// Forms (the contact form) and their submissions

const fieldBase = {
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "Bitte geben Sie einen Feldnamen an.")
    .max(60)
    .regex(/^[a-z][a-z0-9_-]*$/, "Kleinbuchstaben, Ziffern, Bindestrich, Unterstrich."),
  label: z.string().trim().max(200).nullish(),
  required: z.boolean().nullish(),
  // 50 = half width; anything else takes the full row.
  width: z.number().int().min(25).max(100).nullish(),
};

export const FormFieldSchema = z.discriminatedUnion("blockType", [
  z.object({ ...fieldBase, blockType: z.literal("text"), defaultValue: z.string().nullish() }),
  z.object({ ...fieldBase, blockType: z.literal("textarea"), defaultValue: z.string().nullish() }),
  z.object({ ...fieldBase, blockType: z.literal("email") }),
  z.object({ ...fieldBase, blockType: z.literal("number"), defaultValue: z.number().nullish() }),
  z.object({ ...fieldBase, blockType: z.literal("checkbox"), defaultValue: z.boolean().nullish() }),
  z.object({
    ...fieldBase,
    blockType: z.literal("select"),
    defaultValue: z.string().nullish(),
    placeholder: z.string().nullish(),
    options: z.array(item({ label: required("die Bezeichnung"), value: required("den Wert") })),
  }),
  z.object({
    id: z.string().min(1),
    blockType: z.literal("message"),
    message: LexicalDocumentSchema.nullish(),
  }),
]);
export type FormField = z.infer<typeof FormFieldSchema>;
export type NamedFormField = Exclude<FormField, { blockType: "message" }>;

export const FormInputSchema = z.object({
  title: required("den Titel"),
  fields: z.array(FormFieldSchema),
  submitButtonLabel: z.string().trim().max(100).nullish(),
  confirmationMessage: LexicalDocumentSchema.nullish(),
});
export type FormInput = z.infer<typeof FormInputSchema>;

export type FormDoc = FormInput & { id: number; createdAt: Date; updatedAt: Date };

export type Submission = {
  id: number;
  formId: number;
  data: { field: string; value: string }[];
  readAt: Date | null;
  createdAt: Date;
};

// ---------------------------------------------------------------------------------------------
// Redirects

export const RedirectInputSchema = z
  .object({
    from: z.string().trim().min(1, "Bitte geben Sie den alten Pfad an.").max(500),
    type: z.union([z.literal(301), z.literal(302)]),
    toPageId: z.number().int().positive().nullable(),
    toProjektId: z.number().int().positive().nullable(),
    toUrl: z.string().trim().max(2000).nullable(),
  })
  .refine((r) => [r.toPageId, r.toProjektId, r.toUrl].filter(Boolean).length === 1, {
    message: "Bitte genau ein Ziel wählen: eine Seite, ein Projekt oder eine Adresse.",
    path: ["toUrl"],
  });
export type RedirectInput = z.infer<typeof RedirectInputSchema>;

export type Redirect = RedirectInput & {
  id: number;
  // Resolved for the list: the target's public path (or the custom URL).
  destination: string | null;
  targetLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ---------------------------------------------------------------------------------------------
// Versions

export type Version = {
  id: number;
  collection: "pages" | "projekte" | "site_settings";
  docId: number;
  snapshot: unknown;
  kind: "published" | "manual" | "restored";
  createdBy: { id: number; name: string | null } | null;
  createdAt: Date;
};

// ---------------------------------------------------------------------------------------------
// Users

export type User = {
  id: number;
  email: string;
  name: string | null;
  mustChangePassword: boolean;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
};
