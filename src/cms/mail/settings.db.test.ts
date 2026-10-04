// @vitest-environment node
// Runs against DATABASE_URL inside a transaction that is rolled back: the real mailbox stays.
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db, type Tx } from "../db/client";
import { getMailSettings, mailbox, saveMailSettings, setMailPassword } from "./settings";

class Rueckgabe extends Error {}
async function imRollback(fn: (tx: Tx) => Promise<void>) {
  try {
    await db.transaction(async (tx) => {
      await fn(tx);
      throw new Rueckgabe();
    });
  } catch (error) {
    if (!(error instanceof Rueckgabe)) throw error;
  }
}

describe.skipIf(!process.env.DATABASE_URL || !process.env.MAIL_SECRET)("the mailbox", () => {
  it("keeps the password sealed, apart from the settings, and opens it for sending", async () => {
    await imRollback(async (tx) => {
      await tx.execute(sql`delete from cms.mail_settings`);
      expect((await getMailSettings(tx)).passwordSaved).toBe(false);

      await saveMailSettings(
        { provider: "andere", fromAddress: " info@example.com ", fromName: "", port: 1025 },
        tx,
      );
      await setMailPassword(" geheim mit Leerzeichen ", tx);

      const { settings, passwordSaved } = await getMailSettings(tx);
      expect(passwordSaved).toBe(true);
      expect(settings).toMatchObject({
        fromAddress: "info@example.com",
        fromName: null,
        port: 1025,
      });
      expect(JSON.stringify(settings)).not.toContain("geheim");
      const { rows } = await tx.execute<{ p: string }>(
        sql`select password_sealed as p from cms.mail_settings`,
      );
      expect(rows[0]!.p).not.toContain("geheim");
      expect((await mailbox(tx)).password).toBe(" geheim mit Leerzeichen ");

      // Saving the settings again keeps the password; the empty string deletes it.
      await saveMailSettings({ ...settings, fromName: "Muster GmbH" }, tx);
      expect((await mailbox(tx)).password).toBe(" geheim mit Leerzeichen ");
      await setMailPassword("", tx);
      expect((await getMailSettings(tx)).passwordSaved).toBe(false);
    });
  });

  it("refuses an invalid sender address and port", async () => {
    await imRollback(async (tx) => {
      await expect(saveMailSettings({ fromAddress: "kein-at" }, tx)).rejects.toThrow();
      await expect(saveMailSettings({ port: 70000 }, tx)).rejects.toThrow();
    });
  });
});
