// No "server-only" here: the seed, import and migration scripts open this pool from plain Node.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../../env";
import * as schema from "./schema";

// One pool per process. `next dev` re-evaluates modules on every reload, so the pool is kept on
// globalThis there — otherwise each reload would open five more connections.
const globalPool = globalThis as unknown as { __cmsPool?: Pool };

function pool() {
  if (!globalPool.__cmsPool) {
    globalPool.__cmsPool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      statement_timeout: 30_000,
      idle_in_transaction_session_timeout: 60_000,
    });
  }
  return globalPool.__cmsPool;
}

export const db = drizzle({ client: pool(), schema, casing: "snake_case" });

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
