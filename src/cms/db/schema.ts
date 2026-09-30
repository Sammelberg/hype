// The own CMS keeps its tables in the Postgres schema `cms`. Column names are snake_case
// (drizzle `casing: "snake_case"`), so `publishedAt` below is `published_at` in the database.
import { sql, type SQL } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  customType,
  index,
  integer,
  jsonb,
  pgSchema,
  real,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import type { LexicalDocument } from "../rich-text/schema";
import type { FormField, MediaSizes, PageSections, SiteSettings } from "../content/types";

export const cms = pgSchema("cms");

const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });

const timestamps = {
  createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
};

// Slugs are single URL segments: lower-case letters, digits and single hyphens.
export const SLUG_PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";

export const docStatus = cms.enum("doc_status", ["draft", "published"]);

// ---------------------------------------------------------------------------------------------
// Users and sessions

export const users = cms.table(
  "users",
  {
    id: serial().primaryKey(),
    email: varchar({ length: 320 }).notNull(),
    name: varchar({ length: 200 }),
    passwordHash: text().notNull(),
    // What the account may do (src/cms/auth/roles.ts). Accounts from before roles are admins.
    role: text({ enum: ["admin", "redakteur"] })
      .notNull()
      .default("admin"),
    failedAttempts: integer().notNull().default(0),
    lockedUntil: timestamp({ withTimezone: true, mode: "date" }),
    mustChangePassword: boolean().notNull().default(false),
    // Sessions created before this moment are invalid: „überall abmelden“ after a password change.
    sessionsRevokedAt: timestamp({ withTimezone: true, mode: "date" }),
    lastLoginAt: timestamp({ withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`),
    check("users_role_check", sql`${t.role} in ('admin', 'redakteur')`),
  ],
);

export const sessions = cms.table(
  "sessions",
  {
    // sha256 of the token in the cookie; the raw token is never stored.
    id: text().primaryKey(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
    lastSeenAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

// Rate limits: one row per key (`login:<ip>`, `kontakt:<ip>`, `upload:<user>`) counting the
// requests of the current fixed window. Postgres instead of Redis: one service less.
export const rateLimits = cms.table(
  "rate_limits",
  {
    key: text().primaryKey(),
    windowStart: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    count: integer().notNull(),
    expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [index("rate_limits_expires_idx").on(t.expiresAt)],
);

// ---------------------------------------------------------------------------------------------
// Media: files on disk under /media, one row per upload, resized variants in `sizes`.

export const media = cms.table("media", {
  id: serial().primaryKey(),
  filename: varchar({ length: 255 }).notNull().unique(),
  mimeType: varchar({ length: 100 }).notNull(),
  filesize: integer().notNull(),
  width: integer(),
  height: integer(),
  alt: varchar({ length: 500 }).notNull(),
  focalX: real().notNull().default(50),
  focalY: real().notNull().default(50),
  sizes: jsonb().$type<MediaSizes>().notNull().default({}),
  ...timestamps,
});

// ---------------------------------------------------------------------------------------------
// Pages: a tree by parent_id with the public path stored, so `/ueber-uns/arbeitsweise` is one lookup.

const seoColumns = {
  metaTitle: varchar({ length: 200 }),
  metaDescription: varchar({ length: 500 }),
  metaImageId: integer().references(() => media.id, { onDelete: "set null" }),
};

const documentColumns = {
  status: docStatus().notNull().default("draft"),
  publishedAt: timestamp({ withTimezone: true, mode: "date" }),
  // The working copy while editing (autosave writes here); null = no unpublished changes.
  draft: jsonb(),
  // plainText(content), kept for the full-text search column below.
  contentText: text(),
};

const germanSearch = (parts: { a: SQL; b: SQL; c: SQL }) =>
  sql`setweight(to_tsvector('german', ${parts.a}), 'A') || setweight(to_tsvector('german', ${parts.b}), 'B') || setweight(to_tsvector('german', ${parts.c}), 'C')`;

export const pages = cms.table(
  "pages",
  {
    id: serial().primaryKey(),
    slug: varchar({ length: 200 }).notNull().unique(),
    parentId: integer().references((): AnyPgColumn => pages.id, { onDelete: "restrict" }),
    path: text().notNull().unique(),
    title: varchar({ length: 300 }).notNull(),
    lead: text(),
    content: jsonb().$type<LexicalDocument>(),
    // The sections of a page with its own route (home, Leistungen, Projekte, Kontakt).
    sections: jsonb().$type<PageSections>(),
    ...seoColumns,
    ...documentColumns,
    search: tsvector().generatedAlwaysAs((): SQL =>
      germanSearch({
        a: sql`coalesce(${pages.title}, '')`,
        b: sql`coalesce(${pages.lead}, '') || ' ' || coalesce(${pages.metaDescription}, '')`,
        c: sql`coalesce(${pages.contentText}, '')`,
      }),
    ),
    ...timestamps,
  },
  (t) => [
    check("pages_slug_check", sql`${t.slug} ~ ${sql.raw(`'${SLUG_PATTERN}'`)}`),
    index("pages_parent_idx").on(t.parentId),
    index("pages_status_idx").on(t.status),
    index("pages_search_idx").using("gin", t.search),
  ],
);

export const projekte = cms.table(
  "projekte",
  {
    id: serial().primaryKey(),
    slug: varchar({ length: 200 }).notNull().unique(),
    title: varchar({ length: 300 }).notNull(),
    kunde: varchar({ length: 300 }).notNull(),
    summary: text().notNull(),
    content: jsonb().$type<LexicalDocument>(),
    ...seoColumns,
    ...documentColumns,
    search: tsvector().generatedAlwaysAs((): SQL =>
      germanSearch({
        a: sql`coalesce(${projekte.title}, '') || ' ' || coalesce(${projekte.kunde}, '')`,
        b: sql`coalesce(${projekte.summary}, '') || ' ' || coalesce(${projekte.metaDescription}, '')`,
        c: sql`coalesce(${projekte.contentText}, '')`,
      }),
    ),
    ...timestamps,
  },
  (t) => [
    check("projekte_slug_check", sql`${t.slug} ~ ${sql.raw(`'${SLUG_PATTERN}'`)}`),
    index("projekte_status_idx").on(t.status),
    index("projekte_search_idx").using("gin", t.search),
  ],
);

// One row per publish (or manual save / restore), a full snapshot of the document's fields.
export const versions = cms.table(
  "versions",
  {
    id: serial().primaryKey(),
    collection: varchar({ length: 40 }).notNull(),
    docId: integer().notNull(),
    snapshot: jsonb().notNull(),
    kind: varchar({ length: 20 }).notNull(),
    createdBy: integer().references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "versions_collection_check",
      sql`${t.collection} in ('pages', 'projekte', 'site_settings')`,
    ),
    check("versions_kind_check", sql`${t.kind} in ('published', 'manual', 'restored')`),
    index("versions_doc_idx").on(t.collection, t.docId, t.createdAt),
  ],
);

// The site settings are one document (SiteSettings in content/types.ts), one row.
export const siteSettings = cms.table(
  "site_settings",
  {
    id: integer().primaryKey(),
    data: jsonb().$type<SiteSettings>().notNull(),
    draft: jsonb().$type<SiteSettings>(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [check("site_settings_singleton", sql`${t.id} = 1`)],
);

// ---------------------------------------------------------------------------------------------
// Redirects: `from` is normalised (src/lib/redirects.ts); exactly one target.

export const redirects = cms.table(
  "redirects",
  {
    id: serial().primaryKey(),
    from: varchar({ length: 500 }).notNull().unique(),
    type: smallint().notNull().default(301),
    toPageId: integer().references(() => pages.id, { onDelete: "cascade" }),
    toProjektId: integer().references(() => projekte.id, { onDelete: "cascade" }),
    toUrl: text(),
    ...timestamps,
  },
  (t) => [
    check("redirects_type_check", sql`${t.type} in (301, 302)`),
    check(
      "redirects_one_target",
      sql`num_nonnulls(${t.toPageId}, ${t.toProjektId}, ${t.toUrl}) = 1`,
    ),
  ],
);

// ---------------------------------------------------------------------------------------------
// Forms: the contact form's fields as a list; submissions keep field/value pairs only.

export const forms = cms.table("forms", {
  id: serial().primaryKey(),
  title: varchar({ length: 200 }).notNull().unique(),
  fields: jsonb().$type<FormField[]>().notNull().default([]),
  submitButtonLabel: varchar({ length: 100 }),
  confirmationMessage: jsonb().$type<LexicalDocument>(),
  ...timestamps,
});

export const formSubmissions = cms.table(
  "form_submissions",
  {
    id: serial().primaryKey(),
    formId: integer()
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    data: jsonb().$type<{ field: string; value: string }[]>().notNull(),
    readAt: timestamp({ withTimezone: true, mode: "date" }),
    createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("form_submissions_form_idx").on(t.formId, t.createdAt)],
);
