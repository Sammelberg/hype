// `pnpm cms:passwort <e-mail> [passwort]` — sets an account's password from the shell, for the
// day the only admin is locked out. `--anlegen` creates the account instead: the only way to the
// first account (there is no setup page, so an empty database offers nobody a way in).
// Without a password argument a temporary one is generated and must be changed at the next
// sign-in. Local databases only, unless --force.
import { audited } from "../src/cms/audit/log";
import { SHELL } from "../src/cms/audit/types";
import { temporaryPassword } from "../src/cms/auth/temporary-password";
import { AuthError, createUser, findUserByEmail, setPassword } from "../src/cms/auth/users";

const [email, given] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const create = process.argv.includes("--anlegen");
if (!email) {
  console.error("Aufruf: pnpm cms:passwort <e-mail> [passwort] [--anlegen]");
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

const password = given ?? temporaryPassword();
const mustChange = !given;
const user = await findUserByEmail(email);

if (create) {
  if (user) {
    console.error(`Es gibt schon einen Zugang mit der Adresse ${email}.`);
    process.exit(1);
  }
  try {
    // The first account runs everything, accounts included.
    await audited(
      (tx) => createUser({ email, password, role: "admin", mustChangePassword: mustChange }, tx),
      (created) => ({
        actor: SHELL,
        action: "zugang.angelegt",
        target: { type: "zugang", id: created.id },
        details: { email: created.email, rolle: created.role },
      }),
    );
  } catch (error) {
    if (error instanceof AuthError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
} else {
  if (!user) {
    console.error(`Kein Zugang mit der Adresse ${email}. Neu anlegen mit --anlegen.`);
    process.exit(1);
  }
  await audited((tx) => setPassword(user.id, password, { mustChange }, tx), {
    actor: SHELL,
    action: "zugang.passwort-vergeben",
    target: { type: "zugang", id: user.id },
  });
}

const done = create ? `Zugang ${email} angelegt.` : `Passwort für ${email} gesetzt.`;
console.log(
  mustChange
    ? `${done}\nVorläufiges Passwort: ${password}\nBeim nächsten Anmelden muss es ersetzt werden.`
    : done,
);
process.exit(0);
