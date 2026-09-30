// The visitor's address, as our own reverse proxy (nginx/Caddy on the server) reports it: the
// proxy appends the address it sees to X-Forwarded-For, so only the last entry is ours to trust;
// anything before it came from the client and may be invented. This holds only while the app is
// reachable through the proxy alone (Next listens on localhost). Without the header — local
// development — every request shares one key. Pure, for tests.
export function clientIp(headers: Pick<Headers, "get">): string {
  const forwarded = headers.get("x-forwarded-for");
  const last = forwarded
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);
  return last || "unbekannt";
}
