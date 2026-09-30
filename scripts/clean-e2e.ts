// Deletes the contact messages the e2e tests sent (sender E2E_EMAIL), so test runs against a local
// database leave nothing in the admin's inbox. Run by Playwright after every run (e2e/teardown.ts).
import { like, sql } from "drizzle-orm";

import { deleteUser, findUserByEmail } from "../src/cms/auth/users";
import { deleteMedia, listMedia } from "../src/cms/content/media";
import { deletePage, listPages } from "../src/cms/content/pages";
import { deleteProjekt } from "../src/cms/content/projekte";
import { deleteRedirect, listRedirects } from "../src/cms/content/redirects";
import { db } from "../src/cms/db/client";
import { projekte, users } from "../src/cms/db/schema";
import { removeFiles } from "../src/cms/media/store";
import { getContactForm, purgeSubmissionsByValue, saveForm } from "../src/cms/content/forms";
import { E2E_ADMIN, E2E_EMAIL, E2E_REDAKTEUR } from "./seed-data";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname) && process.env.CI !== "true") {
  throw new Error(`Aufräumen abgebrochen: ${url.hostname} ist keine lokale Datenbank.`);
}

const deleted = await purgeSubmissionsByValue(E2E_EMAIL);
console.log(`Testnachrichten gelöscht: ${deleted}`);
// Whatever an aborted run left behind: redirects, pages, projects and images named „e2e-…“.
// Redirects first: a page or project with redirects onto it is not deleted.
for (const redirect of (await listRedirects()).filter(
  (r) => r.from.startsWith("/e2e-") || r.from.startsWith("/projekte/e2e-"),
)) {
  await deleteRedirect(redirect.id).catch(() => undefined);
}
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

// Versions of pages and projects that no longer exist (deleted before versions went with them).
await db.execute(sql`
  delete from cms.versions v
  where (v.collection = 'pages' and not exists (select 1 from cms.pages p where p.id = v.doc_id))
     or (v.collection = 'projekte' and not exists (select 1 from cms.projekte r where r.id = v.doc_id))`);

// The office documents of an aborted e2e run: customers named „E2E …“ with their drafts,
// contracts and orders. Issued invoices never come from e2e (GoBD: they cannot be deleted).
await db.execute(sql`
  with k as (select id from buero.kunden where firma like 'E2E %' or name like 'E2E %')
  delete from buero.rechnungen where status = 'entwurf' and kunde_id in (select id from k)`);
await db.execute(
  sql`delete from buero.vertraege where kunde_id in (select id from buero.kunden where firma like 'E2E %' or name like 'E2E %') and not exists (select 1 from buero.rechnungen r where r.vertrag_id = buero.vertraege.id)`,
);
await db.execute(
  sql`delete from buero.auftraege where kunde_id in (select id from buero.kunden where firma like 'E2E %' or name like 'E2E %') and not exists (select 1 from buero.rechnungen r where r.auftrag_id = buero.auftraege.id)`,
);
await db.execute(
  sql`delete from buero.kunden k where (k.firma like 'E2E %' or k.name like 'E2E %') and not exists (select 1 from buero.rechnungen r where r.kunde_id = k.id)`,
);

// A field an aborted form test added to the contact form („probe-…“).
const form = await getContactForm();
if (form?.fields.some((field) => "name" in field && field.name.startsWith("probe-"))) {
  await saveForm(form.id, {
    title: form.title,
    submitButtonLabel: form.submitButtonLabel,
    confirmationMessage: form.confirmationMessage,
    fields: form.fields.filter((field) => !("name" in field && field.name.startsWith("probe-"))),
  });
}

// Colleagues the account test creates, if a failed run left one behind.
const colleagues = await db
  .delete(users)
  .where(like(users.email, "e2e-kollege-%@example.com"))
  .returning({ id: users.id });
if (colleagues.length) console.log(`Testkollegen gelöscht: ${colleagues.length}`);

for (const email of [E2E_ADMIN.email, E2E_REDAKTEUR.email]) {
  const account = await findUserByEmail(email);
  if (!account) continue;
  await deleteUser(account.id, { evenTheLast: true });
  console.log(`Testzugang ${email} gelöscht.`);
}
process.exit(0);
