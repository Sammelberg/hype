import { gleicheAb, merkeEreignis } from "@/buchung/daten/zahlungen";
import { nachBestaetigung } from "@/lib/buchung-ereignisse";
import { adapterFuer } from "@/lib/zahlung";

// Mollie's webhook: POST with `id=tr_…` whenever a payment changes. The body is never trusted —
// the status is fetched from Mollie's API with our key. Unknown or repeated calls get 200 and do
// nothing (Mollie stops retrying on 200); a fault of ours gets 500, so Mollie tries again later.

const ZAHLUNG = /^tr_[A-Za-z0-9]{4,40}$/;

export async function POST(request: Request) {
  const adapter = adapterFuer("mollie");
  const form = await request.formData().catch(() => null);
  const id = String(form?.get("id") ?? "");
  if (!adapter || !ZAHLUNG.test(id)) return new Response(null, { status: 200 });

  try {
    const r = await gleicheAb(adapter, id, new Date());
    if (r.stand !== "offen") await merkeEreignis("mollie", `${id}:${r.stand}`);
    if (r.neuBestaetigt && r.buchungId) nachBestaetigung(r.buchungId);
    return new Response(null, { status: 200 });
  } catch (error) {
    // An id of another shop or a deleted payment: nothing of ours to change.
    if (error instanceof Error && /Diese Zahlung gibt es nicht/.test(error.message))
      return new Response(null, { status: 200 });
    console.error("Mollie-Webhook nicht verarbeitet", error);
    return new Response(null, { status: 500 });
  }
}
