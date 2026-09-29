// `pnpm cms:migrate` — applies the SQL migrations in src/cms/migrations to DATABASE_URL.
// Drizzle keeps its own ledger in cms.__drizzle_migrations; runs are idempotent.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL fehlt.");

const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle({ client: pool });

await migrate(db, { migrationsFolder: "src/cms/migrations", migrationsSchema: "cms" });
console.log("Migrationen angewendet.");
await pool.end();
