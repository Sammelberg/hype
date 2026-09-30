// Before every e2e run: the admin specs sign in as the e2e account. The teardown
// (scripts/clean-e2e.ts) has removed the one of the last run, and there is no setup page,
// so it is created here again. Local databases and CI only.
import { createUser, findUserByEmail } from "../src/cms/auth/users";
import { E2E_ADMIN } from "./seed-data";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname) && process.env.CI !== "true") {
  throw new Error(`Vorbereitung abgebrochen: ${url.hostname} ist keine lokale Datenbank.`);
}

if (!(await findUserByEmail(E2E_ADMIN.email))) {
  await createUser({
    email: E2E_ADMIN.email,
    name: "E2E Admin",
    password: process.env.E2E_ADMIN_PASSWORD ?? E2E_ADMIN.fallbackPassword,
  });
  console.log("Testzugang angelegt.");
}
process.exit(0);
