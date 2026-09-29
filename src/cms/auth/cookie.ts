// The session cookie's name and attributes. No dependencies, so the smallest module can import it.
import { env } from "../../env";

const secure = env.NEXT_PUBLIC_SERVER_URL.startsWith("https://");

// `__Host-` binds the cookie to this host and requires Secure; on http://localhost we do without.
export const SESSION_COOKIE = secure ? "__Host-cms_session" : "cms_session";
export const SESSION_DAYS = 30;

export const sessionCookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
  expires,
});
