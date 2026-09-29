// `pnpm exec tsx --env-file=.env scripts/drop-payload-tables.ts` — removes Payload's tables from
// schema public, once `pnpm cms:import` has copied the content into schema cms and a backup
// exists. Refuses unless `cms.pages` holds rows; asks for --force off a local database.
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL fehlt.");
const host = new URL(url).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(host) && !process.argv.includes("--force")) {
  throw new Error(`Abgebrochen: ${host} ist keine lokale Datenbank. Mit --force erzwingen.`);
}

const pool = new Pool({ connectionString: url, max: 1 });
const { rows: imported } = await pool.query<{ n: number }>(
  "select count(*)::int as n from cms.pages",
);
if ((imported[0]?.n ?? 0) === 0) {
  throw new Error("cms.pages ist leer: erst `pnpm cms:import`, dann diese Tabellen löschen.");
}
const { rows: tables } = await pool.query<{ table_name: string }>(
  `select table_name from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE'
   and (table_name like 'payload\\_%' or table_name in (
     'users','users_sessions','media','pages','pages_breadcrumbs','_pages_v','_pages_v_version_breadcrumbs',
     'projekte','_projekte_v','site_settings','forms','form_submissions','form_submissions_submission_data',
     'redirects','redirects_rels','search','search_rels')
   or table_name like 'site\\_settings\\_%' or table_name like 'forms\\_blocks\\_%')`,
);
const { rows: enums } = await pool.query<{ typname: string }>(
  `select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
   where n.nspname = 'public' and t.typtype = 'e' and t.typname like 'enum\\_%'`,
);
await pool.query("begin");
for (const { table_name } of tables)
  await pool.query(`drop table if exists public."${table_name}" cascade`);
for (const { typname } of enums)
  await pool.query(`drop type if exists public."${typname}" cascade`);
await pool.query("commit");
console.log(`Payload-Tabellen gelöscht: ${tables.length}, Enums: ${enums.length}.`);
await pool.end();
