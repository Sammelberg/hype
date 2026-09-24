// Pure helpers for the redirects plugin. Relative imports only: also used from Payload hooks,
// which the Payload CLI loads without the `@/` alias.
import { docPath } from "../cms/paths";

type Reference = {
  relationTo: string;
  value: number | string | object;
};

export type RedirectDoc = {
  type?: string | null;
  to?: { type?: string | null; reference?: Reference | null; url?: string | null } | null;
};

// Paths are compared lower-case, without origin, query, hash or trailing slash.
export function normalizePath(input: string) {
  const path = new URL(input || "/", "http://x").pathname.toLowerCase().replace(/\/+$/, "");
  return path || "/";
}

export function resolveRedirect(doc: RedirectDoc) {
  const permanent = doc.type === "301" || doc.type === "308";
  let destination: string | null = null;

  if (doc.to?.type === "reference") {
    const ref = doc.to.reference;
    if (ref && typeof ref.value === "object") {
      const target = ref.value as Record<string, unknown>;
      destination = docPath(ref.relationTo, target);
    }
  } else {
    destination = doc.to?.url?.trim() || null;
  }

  return destination ? { destination, permanent } : null;
}
