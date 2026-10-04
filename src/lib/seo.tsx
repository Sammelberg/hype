import type { Metadata } from "next";

import { env } from "@/env";
import type { MediaDoc } from "@/cms/content/types";

import { clampDescription } from "./description";

type Meta = { title?: string | null; description?: string | null; image?: MediaDoc | null };

// Alt text of the drawn share images (components/site/share-image.tsx).
export const SHARE_ALT = "Vorschaubild mit dem Titel der Seite";

export const absoluteUrl = (path = "/") => new URL(path, env.NEXT_PUBLIC_SERVER_URL).toString();

// Relative on purpose: next/image only optimises local paths, and metadataBase resolves OG URLs.
export const mediaUrl = (media: MediaDoc | null | undefined, size?: keyof MediaDoc["sizes"]) => {
  if (!media) return null;
  return (size && media.sizes[size]?.url) || media.url || null;
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
  const description = meta?.description || clampDescription(fallbackDescription);
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
