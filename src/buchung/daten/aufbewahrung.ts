// Bookings that never came about — an Anfrage nobody took up, one turned down, a hold that lapsed
// unpaid — are deleted six months after their last change, like contact messages (the
// Datenschutzerklärung says so). Bookings that took place or were cancelled are contracts and
// stay as long as the law keeps their papers. One with a payment stays too (to refund, to book).
import { and, inArray, lt, notExists, eq } from "drizzle-orm";

import { db, type Db, type Tx } from "../../cms/db/client";
import { loeschGrenze } from "../../cms/retention/grenze";
import { buchungen, zahlungen } from "../db/schema";

export async function loescheNichtZustandegekommene(
  jetzt: Date,
  client: Db | Tx = db,
): Promise<number> {
  const geloescht = await client
    .delete(buchungen)
    .where(
      and(
        inArray(buchungen.status, ["anfrage", "abgelehnt", "verfallen"]),
        lt(buchungen.updatedAt, loeschGrenze(jetzt)),
        notExists(client.select().from(zahlungen).where(eq(zahlungen.buchungId, buchungen.id))),
      ),
    )
    .returning({ id: buchungen.id });
  return geloescht.length;
}
