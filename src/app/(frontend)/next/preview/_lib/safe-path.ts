// The preview's target: a path on this site, or null. Browsers read `/\evil.com` as `//evil.com`,
// so a prefix check is not enough; the path is resolved against our own origin and must stay there.
export function safePreviewPath(path: string, origin: string): string | null {
  if (!path.startsWith("/") || /[\\\u0000-\u001f]/.test(path)) return null;
  let url: URL;
  try {
    url = new URL(path, origin);
  } catch {
    return null;
  }
  if (url.origin !== new URL(origin).origin) return null;
  return `${url.pathname}${url.search}`;
}
