import "server-only";

import type { ZahlungsAdapter } from "@/buchung/zahlung/adapter";
import { mollieAdapter } from "@/buchung/zahlung/mollie";
import { testAdapter } from "@/buchung/zahlung/test-adapter";
import { env } from "@/env";

// The adapter that takes the Anzahlung online: Mollie once its key is set, else the pretend
// checkout while ZAHLUNG_TEST=1. Null: no online payment, the form offers the invoice only.
export function onlineZahlung(): ZahlungsAdapter | null {
  if (env.MOLLIE_API_KEY)
    return mollieAdapter({ apiKey: env.MOLLIE_API_KEY, basis: env.NEXT_PUBLIC_SERVER_URL });
  if (env.ZAHLUNG_TEST === "1") return testAdapter;
  return null;
}

/** The adapter a stored payment was made with, to ask about it or refund it. */
export function adapterFuer(name: string): ZahlungsAdapter | null {
  if (name === "mollie" && env.MOLLIE_API_KEY)
    return mollieAdapter({ apiKey: env.MOLLIE_API_KEY, basis: env.NEXT_PUBLIC_SERVER_URL });
  if (name === "test" && env.ZAHLUNG_TEST === "1") return testAdapter;
  return null;
}
