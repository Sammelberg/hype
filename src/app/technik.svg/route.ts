import { TECH_LOGOS } from "@/components/site/tech-logos";

// The stack's logos as one SVG sprite (symbols `logo-0` …), served from our own server and cached
// by the browser: the running band on the home page refers to it with <use> (tech-band.tsx).
export const dynamic = "force-static";

export function GET() {
  const symbols = TECH_LOGOS.map(
    (logo, i) =>
      `<symbol id="logo-${i}" viewBox="0 0 24 24"><path fill="currentColor" d="${logo.d}"/></symbol>`,
  ).join("");
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
