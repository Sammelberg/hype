import { shareImage } from "@/components/site/share-image";
import { getPageByPath, getProjektBySlug, getSiteSettings } from "@/data/queries";
import { pageTrail } from "@/lib/breadcrumbs";

// Share image of any page but the home page (which has its own opengraph-image.tsx):
// /vorschaubild/leistungen/web-anwendungen draws /leistungen/web-anwendungen. One route instead of
// an opengraph-image per page, since the CMS catch-all cannot hold one. buildMetadata points here.

// Pages written in code: their title here, as their PageHeader shows it.
const FIXED: Record<string, string> = {
  "/leistungen": "Leistungen",
  "/projekte": "Projekte",
  "/kontakt": "Kontakt",
};

async function titleOf(path: string, segments: string[]) {
  if (FIXED[path]) return { title: FIXED[path] };
  if (segments[0] === "projekte" && segments.length === 2) {
    const projekt = await getProjektBySlug(segments[1]!);
    return projekt ? { title: projekt.title, kicker: projekt.kunde } : null;
  }
  const page = await getPageByPath(segments);
  if (!page) return null;
  // The section a nested page belongs to (Leistungen above Web-Anwendungen).
  const parent = pageTrail(page.breadcrumbs).at(-2);
  return { title: page.title, kicker: parent && parent.path !== "/" ? parent.name : null };
}

export async function GET(_request: Request, { params }: { params: Promise<{ pfad: string[] }> }) {
  const { pfad } = await params;
  const path = `/${pfad.join("/")}`;
  const [settings, found] = await Promise.all([getSiteSettings(), titleOf(path, pfad)]);
  if (!found) return new Response("Nicht gefunden", { status: 404 });
  const image = await shareImage({
    siteName: settings.siteName || "Schwarzwald Systems",
    title: found.title,
    kicker: found.kicker,
    horizonKey: path,
  });
  // Titles change only when the page is edited; an hour is fresh enough for a share preview.
  image.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  return image;
}
