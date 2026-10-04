import "server-only";

import type { ZahlungsAdapter } from "@/buchung/zahlung/adapter";
import { testAdapter } from "@/buchung/zahlung/test-adapter";
import { env } from "@/env";

// The adapter that takes the Anzahlung online: the test adapter while ZAHLUNG_TEST=1; Mollie
// follows in phase 9. Null: no online payment yet, the form offers the invoice only.
export function onlineZahlung(): ZahlungsAdapter | null {
  if (env.ZAHLUNG_TEST === "1") return testAdapter;
  return null;
}
