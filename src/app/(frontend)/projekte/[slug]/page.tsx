import type { Metadata } from "next";
import Image from "next/image";

import { projectPath } from "@/cms/collections/Projects";
import { RichText } from "@/components/site/rich-text";
import { getProjectBySlug, getPublishedProjects } from "@/data/queries";
import { redirectOrNotFound } from "@/data/redirect-or-not-found";
import { absoluteUrl, buildMetadata, JsonLd, mediaUrl } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return buildMetadata({
    meta: {
      ...project.meta,
      image: project.meta?.image ?? project.cover,
    },
    fallbackTitle: project.title,
    fallbackDescription: project.summary,
    path: projectPath(project.slug) ?? "/",
  });
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return redirectOrNotFound(`/projekte/${slug}`);

  const cover = mediaUrl(project.cover, "hero");
  const coverAlt = typeof project.cover === "object" ? project.cover.alt : "";
  const facts = [
    { label: "Jahr", value: project.year },
    { label: "Rolle", value: project.role },
    { label: "Kunde", value: project.client },
  ].filter((f) => f.value);

  return (
    <main className="page-container pt-section">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          description: project.summary,
          url: absoluteUrl(projectPath(project.slug) ?? "/"),
          dateCreated: String(project.year),
          ...(cover ? { image: absoluteUrl(cover) } : {}),
          ...(project.tags?.length ? { keywords: project.tags.join(", ") } : {}),
        }}
      />
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {project.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">{project.summary}</p>

      {cover ? (
        <Image
          src={cover}
          alt={coverAlt}
          width={1920}
          height={1187}
          preload
          sizes="(min-width: 1536px) 1426px, 100vw"
          className="mt-fib-xl aspect-golden w-full rounded-lg object-cover"
        />
      ) : null}

      {/* Golden split: text 61.8 %, facts 38.2 %. Facts come first in the DOM so they read first on mobile. */}
      <div className="mt-fib-xl grid gap-x-grid gap-y-fib-xl lg:grid-cols-golden">
        {facts.length ? (
          <dl className="flex flex-wrap gap-x-10 gap-y-4 text-sm lg:col-start-2 lg:row-start-1 lg:flex-col">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="tabular-nums">{f.value}</dd>
              </div>
            ))}
            {project.url ? (
              <div>
                <dt className="text-muted-foreground">Link</dt>
                <dd>
                  <a href={project.url} rel="noopener" className="underline underline-offset-4">
                    Projekt ansehen
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        <RichText data={project.content} className="max-w-prose lg:col-start-1 lg:row-start-1" />
      </div>

      {project.gallery?.length ? (
        <ul className="mt-fib-xl grid gap-grid sm:grid-cols-2">
          {project.gallery.map((item) => {
            const src = mediaUrl(item, "card");
            if (!src || typeof item === "number") return null;
            return (
              <li key={item.id}>
                <Image
                  src={src}
                  alt={item.alt}
                  width={960}
                  height={593}
                  sizes="(min-width: 1536px) 696px, (min-width: 640px) 50vw, 100vw"
                  className="aspect-golden w-full rounded-lg object-cover"
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}
