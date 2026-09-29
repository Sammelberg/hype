import type { Metadata } from "next";

import { env } from "@/env";
import type { Media } from "@/payload-types";

type Meta = { title?: string | null; description?: string | null; image?: number | Media | null };

// Alt text of the drawn share images (components/site/share-image.tsx).
export const SHARE_ALT = "Seitentitel von Schwarzwald Systems über einem gezeichneten Horizont";

export const absoluteUrl = (path = "/") => new URL(path, env.NEXT_PUBLIC_SERVER_URL).toString();

export const mediaUrl = (
  media: number | Media | null | undefined,
  size?: keyof NonNullable<Media["sizes"]>,
) => {
  if (!media || typeof media === "number") return null;
  // Relative on purpose: next/image only optimises local paths, and metadataBase resolves OG URLs.
  const url = (size && media.sizes?.[size]?.url) || media.url;
  if (!url) return null;
  // Payload prefixes serverURL; strip our own origin so next/image treats it as a local path.
  const parsed = new URL(url, env.NEXT_PUBLIC_SERVER_URL);
  return parsed.origin === new URL(env.NEXT_PUBLIC_SERVER_URL).origin
    ? `${parsed.pathname}${parsed.search}`
    : url;
};

// Builds page metadata from the SEO plugin's `meta` group with sensible fallbacks.
export function buildMetadata({
  meta,
  fallbackTitle,
  fallbackDescription,
  path,
}: {
  meta?: Meta | null;
  fallbackTitle: string;
  fallbackDescription?: string | null;
  path: string;
}): Metadata {
  const title = meta?.title || fallbackTitle;
  const description = meta?.description || fallbackDescription || undefined;
  const image = mediaUrl(meta?.image ?? null, "hero");
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      locale: "de_DE",
      type: "website",
      // Without an image from the CMS, the page's drawn share image (/vorschaubild + its path).
      images: [
        image
          ? { url: image }
          : { url: `/vorschaubild${path}`, width: 1200, height: 630, alt: SHARE_ALT },
      ],
    },
    // Shown large on X and elsewhere.
    twitter: { card: "summary_large_image" },
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inline; content is our own CMS data, escaped via JSON.stringify.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
