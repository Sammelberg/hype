// Passwords: argon2id from Node's own crypto (no package), stored as a PHC string.
// `verifyPassword` takes the same time for a missing user as for a wrong password.
import { argon2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const hash = promisify(argon2);

const PARAMS = { memory: 65536, passes: 3, parallelism: 1, tagLength: 32 } as const;

export { MIN_PASSWORD_LENGTH, passwordProblem } from "./password-rules";

const b64 = (buf: Uint8Array) => Buffer.from(buf).toString("base64").replace(/=+$/, "");
const unb64 = (s: string) => Buffer.from(s, "base64");

export async function hashPassword(password: string, salt = randomBytes(16)): Promise<string> {
  const tag = await hash("argon2id", {
    message: Buffer.from(password, "utf8"),
    nonce: salt,
    ...PARAMS,
  });
  return `$argon2id$v=19$m=${PARAMS.memory},t=${PARAMS.passes},p=${PARAMS.parallelism}$${b64(salt)}$${b64(tag)}`;
}

const PHC = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  const match = stored ? PHC.exec(stored) : null;
  // No hash to compare against: still do the work, so the answer takes as long as a real check.
  const [memory, passes, parallelism, salt, expected] = match
    ? [Number(match[1]), Number(match[2]), Number(match[3]), unb64(match[4]!), unb64(match[5]!)]
    : [
        PARAMS.memory,
        PARAMS.passes,
        PARAMS.parallelism,
        Buffer.alloc(16),
        Buffer.alloc(PARAMS.tagLength),
      ];
  const tag = await hash("argon2id", {
    message: Buffer.from(password, "utf8"),
    nonce: salt,
    memory,
    passes,
    parallelism,
    tagLength: expected.length,
  });
  return match !== null && timingSafeEqual(Buffer.from(tag), expected);
}
