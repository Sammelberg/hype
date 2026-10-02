import { FIR_DESIGNS } from "@/components/site/fir-shapes";
import { hullOf } from "@/lib/fir-hull";

// Our three firs as one SVG sprite, served from our own server and cached by the browser: the
// drawings (`dicht`, `schlank`, `konkav`) and their outlines (`dicht-grund` …), which a horizon
// fills in its ground colour behind each fir so no line runs through it. Every pen-drawn horizon
// refers to it with <use>, so no page carries the drawings in its HTML (pen-horizon.tsx).
export const dynamic = "force-static";

export function GET() {
  const symbols = Object.entries(FIR_DESIGNS)
    .map(
      ([name, fir]) =>
        `<symbol id="${name}" viewBox="${fir.viewBox}"><path fill="currentColor" d="${fir.d}"/></symbol>` +
        `<symbol id="${name}-grund" viewBox="${fir.viewBox}"><path fill="currentColor" d="${hullOf(fir.d)}"/></symbol>`,
    )
    .join("");
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
