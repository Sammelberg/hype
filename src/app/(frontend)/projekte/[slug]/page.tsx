import type { Metadata } from "next";

import { ClosingCta } from "@/components/site/closing-cta";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { PageHeader } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { getProjekte, getProjektBySlug } from "@/data/queries";
import { redirectOrNotFound } from "@/data/redirect-or-not-found";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projekte = await getProjekte();
  return projekte.map((projekt) => ({ slug: projekt.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const projekt = await getProjektBySlug(slug);
  if (!projekt) return {};
  return buildMetadata({
    meta: projekt.meta,
    fallbackTitle: projekt.title,
    fallbackDescription: projekt.summary,
    path: projekt.path,
  });
}

export default async function ProjektPage({ params }: Props) {
  const { slug } = await params;
  const projekt = await getProjektBySlug(slug);
  if (!projekt) return redirectOrNotFound(`/projekte/${slug}`);

  const path = projekt.path;

  return (
    <main>
      <PageHeader
        title={projekt.title}
        kicker={projekt.kunde}
        lead={projekt.summary}
        breadcrumbs={
          <PageBreadcrumbs
            trail={[
              { name: "Startseite", path: "/" },
              { name: "Projekte", path: "/projekte" },
              { name: projekt.title, path },
            ]}
          />
        }
        horizonKey={path}
      />
      <div className="page-container py-16 sm:py-24">
        <RichText data={projekt.content} className="prose-lg max-w-prose 3xl:prose-xl" />
      </div>
      <ClosingCta />
    </main>
  );
}
