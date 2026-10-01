import { timingSafeEqual } from "node:crypto";

import { veroeffentlicheFaellige } from "@/cms/content/geplant";
import { revalidateDocument } from "@/cms/revalidate";
import { env } from "@/env";

// The server's timer (pnpm cms:geplant) publishes what was scheduled and rebuilds its pages.
// Only with CRON_SECRET as bearer token; without the variable the route does not exist.
const gleich = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function POST(request: Request) {
  const secret = env.CRON_SECRET;
  if (!secret) return new Response("Nicht gefunden.", { status: 404 });
  const auth = request.headers.get("authorization") ?? "";
  if (!gleich(auth, `Bearer ${secret}`)) return new Response("Nicht erlaubt.", { status: 401 });
  const ergebnis = await veroeffentlicheFaellige();
  if (ergebnis.pfade.length > 0) revalidateDocument(ergebnis.pfade);
  return Response.json({
    veroeffentlicht: ergebnis.veroeffentlicht,
    fehler: ergebnis.fehler,
  });
}
