// Applies the project's migrations in src/buchung/migrations (after kern's, see `pnpm migrate`).
// Its own ledger in buchung.__drizzle_migrations, so the two tracks never judge each other's dates.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL fehlt.");

const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle({ client: pool });

await migrate(db, { migrationsFolder: "src/buchung/migrations", migrationsSchema: "buchung" });
console.log("Migrationen (Buchung) angewendet.");
await pool.end();
