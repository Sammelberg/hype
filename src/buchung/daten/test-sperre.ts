// For the booking module's database tests only: one file at a time. They share rows no test can
// avoid (the BU number series, the one settings row) inside long transactions, and two files
// running in parallel deadlocked on them. A session-level advisory lock on its own connection,
// taken before a file's first test and released after its last, puts the files in a queue.
import { Pool } from "pg";

const SCHLUESSEL = 7_302_610; // „buchung“ tests; any number no other code uses

export async function sperreTestdatei(): Promise<() => Promise<void>> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const client = await pool.connect();
  await client.query("select pg_advisory_lock($1)", [SCHLUESSEL]);
  return async () => {
    await client.query("select pg_advisory_unlock($1)", [SCHLUESSEL]);
    client.release();
    await pool.end();
  };
}
