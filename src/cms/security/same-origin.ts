// Whether a request was sent by a page of this site, as Next checks its server actions: the host
// in Origin against the host the request was made to (X-Forwarded-Host, else Host). Not
// request.url: behind the server's entrance (Caddy) or as the standalone server it names the
// app's own address (http://schwarzwald-app:3000, http://0.0.0.0:3002), never the site's. The
// scheme is left out for the same reason: the entrance speaks https, the app behind it http.
// Pure, for tests.
export function sameOrigin(headers: Pick<Headers, "get">): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host.split(",")[0]!.trim();
  } catch {
    return false;
  }
}
