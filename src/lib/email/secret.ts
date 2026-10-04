// The mailbox password is stored encrypted (AES-256-GCM). The key is derived from the server's
// MAIL_SECRET, so a database dump alone does not reveal it; a new MAIL_SECRET means the owner
// enters the password once more. Stored form: `v1:<iv>:<tag>:<ciphertext>`, base64url.
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

const keyFrom = (serverSecret: string) =>
  Buffer.from(hkdfSync("sha256", serverSecret, "kern-email", "mailbox-password", 32));

export function sealSecret(plain: string, serverSecret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(serverSecret), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(":");
}

/** The password, or null when the value was changed or sealed under another server secret. */
export function openSecret(sealed: string, serverSecret: string): string | null {
  const [version, iv, tag, data] = sealed.split(":");
  if (version !== "v1" || !iv || !tag || data === undefined) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      keyFrom(serverSecret),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
