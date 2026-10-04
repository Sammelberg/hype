// The test adapter: a pretend checkout on our own site (/buchung/<token>/testzahlung) with
// „Bezahlen“ and „Abbrechen“, so the whole booking can be walked through without a provider.
// Only offered while ZAHLUNG_TEST=1 (development, CI); never on a server.
import { randomBytes } from "node:crypto";

import type { ZahlungsAdapter } from "./adapter";

export const testAdapter: ZahlungsAdapter = {
  name: "test",
  async starte(z) {
    const externId = `test_${randomBytes(9).toString("base64url")}`;
    return { externId, weiter: `/buchung/${z.token}/testzahlung?zahlung=${externId}` };
  },
};
