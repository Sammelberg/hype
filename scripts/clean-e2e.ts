// Deletes the contact messages the e2e tests sent (sender E2E_EMAIL), so test runs against a local
// database leave nothing in the admin's inbox. Run by Playwright after every run (e2e/teardown.ts).
import { getPayload } from "payload";

import config from "../src/payload.config";
import { E2E_EMAIL } from "./seed-data";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname) && process.env.CI !== "true") {
  throw new Error(`Aufräumen abgebrochen: ${url.hostname} ist keine lokale Datenbank.`);
}

const payload = await getPayload({ config });
const { docs } = await payload.delete({
  collection: "form-submissions",
  where: { "submissionData.value": { equals: E2E_EMAIL } },
  overrideAccess: true,
});
payload.logger.info(`Testnachrichten gelöscht: ${docs.length}`);
process.exit(0);
