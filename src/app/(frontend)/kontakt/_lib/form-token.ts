// The contact form's start time, signed by the server: `<ms>.<hmac>`. A bot could otherwise
// send any time it likes and never be "too fast". Valid for a day, never from the future.
import { createHmac, timingSafeEqual } from "node:crypto";

export const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const mac = (startedAt: number, secret: string) =>
  createHmac("sha256", secret).update(`kontakt:${startedAt}`).digest("base64url");

export function signStart(startedAt: number, secret: string): string {
  return `${startedAt}.${mac(startedAt, secret)}`;
}

// The start time the server signed, or null for anything else.
export function verifyStart(token: string, now: number, secret: string): number | null {
  const [time, signature, ...rest] = token.split(".");
  if (!time || !signature || rest.length || !/^\d{1,15}$/.test(time)) return null;
  const startedAt = Number(time);
  const expected = Buffer.from(mac(startedAt, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (startedAt > now || now - startedAt > TOKEN_MAX_AGE_MS) return null;
  return startedAt;
}
