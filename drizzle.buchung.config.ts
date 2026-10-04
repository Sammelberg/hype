import { defineConfig } from "drizzle-kit";

// The project's own migration track for the booking schema `buchung`, apart from kern's track
// (drizzle.config.ts → src/cms/migrations): a kern migration pulled from upstream later must not
// be skipped because a project migration carries a newer timestamp.
// `pnpm migrate:create:buchung <name>` writes one; `pnpm migrate` applies both tracks.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/buchung/db/schema.ts",
  out: "./src/buchung/migrations",
  schemaFilter: ["buchung"],
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
