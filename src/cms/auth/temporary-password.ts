// Temporary passwords, handed over in person and replaced at the first sign-in.
// 20 characters from 32 lower-case letters and digits without look-alikes (no l, o, 0, 1): 100 bits,
// in groups of four for reading aloud. 256 is a multiple of 32, so every letter is equally likely.
import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const LENGTH = 20;

export const TEMPORARY_PASSWORD_BITS = LENGTH * Math.log2(ALPHABET.length);

export function temporaryPassword(): string {
  const letters = [...randomBytes(LENGTH)].map((byte) => ALPHABET[byte % ALPHABET.length]);
  return letters.join("").match(/.{4}/g)!.join("-");
}
