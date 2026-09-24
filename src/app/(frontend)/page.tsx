import type { Metadata } from "next";
import Link from "next/link";

import { RichText } from "@/components/site/rich-text";
import { Button } from "@/components/ui/button";
import { getHomePage, getSiteSettings } from "@/data/queries";
import { firstParagraph } from "@/lib/rich-text";
import { absoluteUrl, JsonLd, mediaUrl } from "@/lib/seo";

// The start page is the Payload page with the slug „startseite“ (src/cms/collections/Pages.ts):
// its title and content fill the page, its SEO tab the metadata. Without it, name and tagline
// from the site settings stand in. Replace this layout with the project's own sections.
export async function generateMetadata(): Promise<Metadata> {
  const [home, settings] = await Promise.all([getHomePage(), getSiteSettings()]);
  const description =
    home?.meta?.description || firstParagraph(home?.content) || settings.description;
  const image = mediaUrl(home?.meta?.image ?? null, "hero");
  return {
    ...(home?.meta?.title ? { title: { absolute: home.meta.title } } : {}),
    description: description ?? undefined,
    alternates: { canonical: "/" },
    ...(image ? { openGraph: { images: [{ url: image }] } } : {}),
  };
}

export default async function HomePage() {
  const [home, settings] = await Promise.all([getHomePage(), getSiteSettings()]);
  const title = home?.title || settings.siteName || "Website";

  return (
    <main className="page-container pt-section">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: settings.siteName,
          url: absoluteUrl("/"),
          ...(settings.description ? { description: settings.description } : {}),
        }}
      />
      <section aria-labelledby="start-titel" className="max-w-4xl">
        <h1
          id="start-titel"
          className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
        >
          {title}
        </h1>
        {settings.tagline ? (
          <p className="mt-fib-md max-w-2xl text-xl text-pretty text-muted-foreground">
            {settings.tagline}
          </p>
        ) : null}
        <div className="mt-fib-lg flex flex-wrap gap-fib-sm">
          <Button asChild size="lg">
            <Link href="/kontakt">Kontakt aufnehmen</Link>
          </Button>
        </div>
      </section>

      {home?.content ? (
        <section aria-label="Einführung" className="mt-section max-w-3xl">
          <RichText data={home.content} />
        </section>
      ) : null}
    </main>
  );
}
