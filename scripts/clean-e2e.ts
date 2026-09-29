// Deletes the contact messages the e2e tests sent (sender E2E_EMAIL), so test runs against a local
// database leave nothing in the admin's inbox. Run by Playwright after every run (e2e/teardown.ts).
import { like } from "drizzle-orm";

import { deleteUser, findUserByEmail } from "../src/cms/auth/users";
import { deleteMedia, listMedia } from "../src/cms/content/media";
import { deletePage, listPages } from "../src/cms/content/pages";
import { deleteProjekt } from "../src/cms/content/projekte";
import { db } from "../src/cms/db/client";
import { projekte } from "../src/cms/db/schema";
import { removeFiles } from "../src/cms/media/store";
import { purgeSubmissionsByValue } from "../src/cms/content/forms";
import { E2E_ADMIN, E2E_EMAIL } from "./seed-data";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname) && process.env.CI !== "true") {
  throw new Error(`Aufräumen abgebrochen: ${url.hostname} ist keine lokale Datenbank.`);
}

const deleted = await purgeSubmissionsByValue(E2E_EMAIL);
console.log(`Testnachrichten gelöscht: ${deleted}`);
// Whatever an aborted editor run left behind: pages, projects and images named „e2e-…“.
for (const page of (await listPages()).filter((p) => p.slug.startsWith("e2e-"))) {
  await deletePage(page.id).catch(() => undefined);
}
for (const row of await db
  .select({ id: projekte.id })
  .from(projekte)
  .where(like(projekte.slug, "e2e-%"))) {
  await deleteProjekt(row.id).catch(() => undefined);
}
for (const item of (await listMedia()).filter((m) => m.filename.startsWith("e2e-bild-"))) {
  const doc = await deleteMedia(item.id);
  if (doc) await removeFiles([doc.filename, ...Object.values(doc.sizes).map((s) => s.filename)]);
}

const admin = await findUserByEmail(E2E_ADMIN.email);
if (admin) {
  await deleteUser(admin.id, { evenTheLast: true });
  console.log("Testzugang gelöscht.");
}
process.exit(0);
