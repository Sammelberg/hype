// A booking's customer link. The database keeps its sha256 (to find the booking) and the link
// itself sealed, under a key derived from FORM_SECRET for this purpose only, so the confirmation
// after payment and the reminders can carry it. A new FORM_SECRET makes old links unsendable,
// never readable by someone else. Relative imports: scripts/buchung-takt.ts loads this.
import { env } from "../../env";
import { openSecret, sealSecret } from "../../lib/email/secret";

const schluessel = () => `${env.FORM_SECRET}:buchungslink`;

export const versiegleLink = (token: string) => sealSecret(token, schluessel());
export const oeffneLink = (versiegelt: string | null) =>
  versiegelt ? openSecret(versiegelt, schluessel()) : null;

export const buchungsUrl = (token: string) =>
  new URL(`/buchung/${token}`, env.NEXT_PUBLIC_SERVER_URL).toString();
