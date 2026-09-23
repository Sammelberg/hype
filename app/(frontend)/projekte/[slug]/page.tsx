import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { projectPath } from "@/collections/Projects";
import { RichText } from "@/components/site/rich-text";
import { getProjectBySlug, getPublishedProjects } from "@/lib/queries";
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
  if (!project) notFound();

  const cover = mediaUrl(project.cover, "hero");
  const coverAlt = typeof project.cover === "object" ? project.cover.alt : "";
  const facts = [
    { label: "Jahr", value: project.year },
    { label: "Rolle", value: project.role },
    { label: "Kunde", value: project.client },
  ].filter((f) => f.value);

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-12">
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

      {facts.length ? (
        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
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

      {cover ? (
        <Image
          src={cover}
          alt={coverAlt}
          width={1920}
          height={1200}
          priority
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="mt-12 w-full rounded-lg object-cover"
        />
      ) : null}

      <RichText data={project.content} className="mt-12" />

      {project.gallery?.length ? (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {project.gallery.map((item) => {
            const src = mediaUrl(item, "card");
            if (!src || typeof item === "number") return null;
            return (
              <li key={item.id}>
                <Image
                  src={src}
                  alt={item.alt}
                  width={960}
                  height={600}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="w-full rounded-lg object-cover"
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}
