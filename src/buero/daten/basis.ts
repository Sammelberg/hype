// Shared by the office's repositories: its error type and the number series.
import { sql } from "drizzle-orm";

import type { Db, Tx } from "../../cms/db/client";
import { dokumentNummer } from "../logik/ablauf";
import { nummernkreise } from "../db/schema";
import { CmsError } from "../../cms/errors";

/** An error the admin shows as it is; `field` names the input to blame. */
export class BueroError extends CmsError {
  constructor(message: string, field?: string) {
    super(message, field);
  }
}

/** The next number of a series, counted inside the caller's transaction (no gaps, no reuse). */
export async function naechsteNummer(tx: Db | Tx, praefix: string, jahr: number) {
  const [row] = await tx
    .insert(nummernkreise)
    .values({ praefix, jahr, letzte: 1 })
    .onConflictDoUpdate({
      target: [nummernkreise.praefix, nummernkreise.jahr],
      set: { letzte: sql`${nummernkreise.letzte} + 1` },
    })
    .returning({ letzte: nummernkreise.letzte });
  const laufend = row!.letzte;
  return jahr === 0
    ? `${praefix}-${String(laufend).padStart(4, "0")}`
    : dokumentNummer(praefix, jahr, laufend);
}
