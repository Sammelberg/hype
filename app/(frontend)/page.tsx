import { getPayloadClient } from "@/lib/payload";

export const revalidate = 60;

export default async function HomePage() {
  const payload = await getPayloadClient();
  const { docs: projects } = await payload.find({
    collection: "projects",
    where: { _status: { equals: "published" } },
    sort: "-year",
    limit: 12,
    depth: 0,
    select: { title: true, slug: true, summary: true, year: true },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-balance">Selected work</h1>
      {projects.length === 0 ? (
        <p className="mt-6 text-pretty text-muted-foreground">
          No published projects yet. Add one in the admin at <code>/admin</code>.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-border">
          {projects.map((project) => (
            <li key={project.id} className="flex items-baseline justify-between gap-6 py-6">
              <div>
                <h2 className="text-lg font-medium">{project.title}</h2>
                <p className="mt-1 text-pretty text-muted-foreground">{project.summary}</p>
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">{project.year}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
