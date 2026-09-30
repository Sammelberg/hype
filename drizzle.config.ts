import { defineConfig } from "drizzle-kit";

// The own CMS lives in the Postgres schema `cms`, apart from anything else in the database.
// `pnpm migrate:create <name>` writes a migration from schema.ts; `pnpm migrate` applies them
// (src/cms/db/migrate.ts). DATABASE_URL is only needed for the introspection commands.
export default defineConfig({
  dialect: "postgresql",
  // The CMS and, in its own schema, the office (customers, orders, contracts, invoices).
  schema: ["./src/cms/db/schema.ts", "./src/buero/db/schema.ts"],
  out: "./src/cms/migrations",
  schemaFilter: ["cms", "buero"],
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
