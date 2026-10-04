// `pnpm cms:aufbewahrung` — applies the retention periods, from cron on the server once a night:
//   0 3 * * *  cd /srv/kern && pnpm cms:aufbewahrung >> /var/log/kern-aufbewahrung.log 2>&1
// Deletes contact messages older than six months (read or not), expired sessions, used or expired
// password links and spent rate limit windows, and records what it did in the audit log, in one transaction. The audit log
// itself and invoices are kept: GoBD asks for years, not months.
import { audited } from "../src/cms/audit/log";
import { SHELL } from "../src/cms/audit/types";
import { purgeResets } from "../src/cms/auth/reset";
import { purgeExpiredSessions } from "../src/cms/auth/session";
import { purgeSubmissionsBefore } from "../src/cms/content/forms";
import { ANFRAGEN_MONATE, loeschGrenze } from "../src/cms/retention/grenze";
import { purgeRateLimits } from "../src/cms/security/rate-limit";

const now = new Date();
const grenze = loeschGrenze(now);

const counts = await audited(
  async (tx) => ({
    anfragen: await purgeSubmissionsBefore(grenze, tx),
    sitzungen: await purgeExpiredSessions(tx),
    passwortLinks: await purgeResets(now, tx),
    zaehler: await purgeRateLimits(now, tx),
  }),
  (c) => ({
    actor: SHELL,
    action: "aufbewahrung",
    details: { ...c, anfragenVor: grenze.toISOString(), monate: ANFRAGEN_MONATE },
  }),
);

console.log(
  `Aufbewahrung ${now.toISOString()}: ${counts.anfragen} Anfrage(n) vor ${grenze.toISOString()}, ` +
    `${counts.sitzungen} abgelaufene Sitzung(en), ${counts.passwortLinks} Passwort-Link(s), ` +
    `${counts.zaehler} alte Zähler gelöscht.`,
);
process.exit(0);
