import { defineConfig } from "drizzle-kit";

// The own CMS lives in the Postgres schema `cms`, apart from anything else in the database.
// `pnpm cms:generate <name>` writes a migration from schema.ts; `pnpm cms:migrate` applies them
// (src/cms/db/migrate.ts). DATABASE_URL is only needed for the introspection commands.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/cms/db/schema.ts",
  out: "./src/cms/migrations",
  schemaFilter: ["cms"],
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
