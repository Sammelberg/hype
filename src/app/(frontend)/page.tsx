import Image from "next/image";
import Link from "next/link";

import { projectPath } from "@/cms/collections/Projects";
import { absoluteUrl, JsonLd, mediaUrl } from "@/lib/seo";
import { getPublishedProjects, getSiteSettings } from "@/data/queries";

export default async function HomePage() {
  const [settings, projects] = await Promise.all([getSiteSettings(), getPublishedProjects()]);

  return (
    <main className="page-container pt-section">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: settings.ownerName,
          url: absoluteUrl("/"),
          ...(settings.socialLinks?.length
            ? { sameAs: settings.socialLinks.map((s) => s.url) }
            : {}),
        }}
      />
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {settings.ownerName || settings.siteName || "Portfolio"}
      </h1>
      {settings.tagline ? (
        <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">
          {settings.tagline}
        </p>
      ) : null}

      <section
        id="projekte"
        aria-labelledby="projekte-titel"
        className="mt-section scroll-mt-fib-lg"
      >
        <h2 id="projekte-titel" className="text-sm font-medium text-muted-foreground">
          Ausgewählte Projekte
        </h2>
        {projects.length === 0 ? (
          <p className="mt-6 text-pretty text-muted-foreground">
            Noch keine Projekte veröffentlicht.
          </p>
        ) : (
          <ul className="mt-fib-md grid gap-x-grid gap-y-fib-xl sm:grid-cols-2">
            {projects.map((project, index) => {
              const cover = mediaUrl(project.cover, "card");
              const alt = typeof project.cover === "object" ? project.cover.alt : "";
              return (
                <li key={project.id}>
                  <Link href={projectPath(project.slug) as never} className="group block">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={alt}
                        width={960}
                        height={593}
                        sizes="(min-width: 1536px) 696px, (min-width: 640px) 50vw, 100vw"
                        // First row is above the fold (LCP): load it right away.
                        loading={index < 2 ? "eager" : "lazy"}
                        className="aspect-golden w-full rounded-lg object-cover"
                      />
                    ) : null}
                    <div className="mt-4 flex items-baseline justify-between gap-4">
                      <h3 className="font-medium group-hover:underline">{project.title}</h3>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {project.year}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-pretty text-muted-foreground">
                      {project.summary}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
