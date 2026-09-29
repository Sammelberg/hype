// `pnpm cms:passwort <e-mail> [passwort]` — sets an account's password from the shell, for the
// day the only admin is locked out. Without a password argument a temporary one is generated
// and must be changed at the next sign-in. Local databases only, unless --force.
import { randomBytes } from "node:crypto";

import { findUserByEmail, setPassword } from "../src/cms/auth/users";

const [email, given] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!email) {
  console.error("Aufruf: pnpm cms:passwort <e-mail> [passwort]");
  process.exit(1);
}
const url = new URL(process.env.DATABASE_URL ?? "");
if (
  !["localhost", "127.0.0.1", "::1"].includes(url.hostname) &&
  !process.argv.includes("--force")
) {
  throw new Error(
    `Abgebrochen: ${url.hostname} ist keine lokale Datenbank. Mit --force erzwingen.`,
  );
}

const user = await findUserByEmail(email);
if (!user) {
  console.error(`Kein Zugang mit der Adresse ${email}.`);
  process.exit(1);
}
const password = given ?? `neu-${randomBytes(6).toString("base64url")}`;
await setPassword(user.id, password, { mustChange: !given });
console.log(
  given
    ? `Passwort für ${email} gesetzt.`
    : `Vorläufiges Passwort für ${email}: ${password}\nBeim nächsten Anmelden muss es ersetzt werden.`,
);
process.exit(0);
