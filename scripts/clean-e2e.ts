// Deletes the contact messages the e2e tests sent (sender E2E_EMAIL), so test runs against a local
// database leave nothing in the admin's inbox. Run by Playwright after every run (e2e/teardown.ts).
import { deleteUser, findUserByEmail } from "../src/cms/auth/users";
import { purgeSubmissionsByValue } from "../src/cms/content/forms";
import { E2E_ADMIN, E2E_EMAIL } from "./seed-data";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname) && process.env.CI !== "true") {
  throw new Error(`Aufräumen abgebrochen: ${url.hostname} ist keine lokale Datenbank.`);
}

const deleted = await purgeSubmissionsByValue(E2E_EMAIL);
console.log(`Testnachrichten gelöscht: ${deleted}`);
const admin = await findUserByEmail(E2E_ADMIN.email);
if (admin) {
  await deleteUser(admin.id, { evenTheLast: true });
  console.log("Testzugang gelöscht.");
}
process.exit(0);
