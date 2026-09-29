// Paths are compared lower-case, without origin, query, hash or trailing slash — for redirect
// sources as they are stored (src/cms/content/redirects.ts) and as requests arrive.
export function normalizePath(input: string) {
  const path = new URL(input || "/", "http://x").pathname.toLowerCase().replace(/\/+$/, "");
  return path || "/";
}
