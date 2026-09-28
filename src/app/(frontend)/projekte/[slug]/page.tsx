import type { Metadata } from "next";

import { projektPath } from "@/cms/collections/Projekte";
import { RichText } from "@/components/site/rich-text";
import { getProjekte, getProjektBySlug } from "@/data/queries";
import { redirectOrNotFound } from "@/data/redirect-or-not-found";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projekte = await getProjekte();
  return projekte.map((projekt) => ({ slug: String(projekt.slug) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const projekt = await getProjektBySlug(slug);
  if (!projekt) return {};
  return buildMetadata({
    meta: projekt.meta,
    fallbackTitle: projekt.title,
    fallbackDescription: projekt.summary,
    path: projektPath(projekt as unknown as Record<string, unknown>) ?? `/projekte/${slug}`,
  });
}

export default async function ProjektPage({ params }: Props) {
  const { slug } = await params;
  const projekt = await getProjektBySlug(slug);
  if (!projekt) return redirectOrNotFound(`/projekte/${slug}`);

  return (
    <main className="page-container max-w-3xl pt-16 sm:pt-24">
      <p className="text-sm font-medium text-primary-soft">{projekt.kunde}</p>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight text-balance">{projekt.title}</h1>
      <RichText data={projekt.content} className="mt-10" />
    </main>
  );
}
