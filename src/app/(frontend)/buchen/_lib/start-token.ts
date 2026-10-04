// The booking form's start time, signed by the server: `<ms>.<hmac>`, like the contact form's
// but under its own name, so neither token passes for the other. A form sent sooner than a
// person could fill five steps, or with a start the server never signed, is a bot.
import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_ALTER_MS = 24 * 60 * 60 * 1000;
/** Nobody chooses a Figur, a date and types an address in less. */
export const MIN_DAUER_MS = 15_000;

const mac = (start: number, secret: string) =>
  createHmac("sha256", secret).update(`buchen:${start}`).digest("base64url");

export const signiereStart = (start: number, secret: string) => `${start}.${mac(start, secret)}`;

/** „ok“ for a start the server signed long enough ago; „zu-schnell“ or „ungueltig“ otherwise. */
export function pruefeStart(
  token: string,
  jetzt: number,
  secret: string,
): "ok" | "zu-schnell" | "ungueltig" {
  const [zeit, signatur, ...rest] = token.split(".");
  if (!zeit || !signatur || rest.length || !/^\d{1,15}$/.test(zeit)) return "ungueltig";
  const start = Number(zeit);
  const erwartet = Buffer.from(mac(start, secret));
  const gegeben = Buffer.from(signatur);
  if (erwartet.length !== gegeben.length || !timingSafeEqual(erwartet, gegeben)) return "ungueltig";
  if (start > jetzt || jetzt - start > MAX_ALTER_MS) return "ungueltig";
  return jetzt - start < MIN_DAUER_MS ? "zu-schnell" : "ok";
}
