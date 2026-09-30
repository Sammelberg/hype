import { requireUserForAction } from "@/cms/auth/guard";
import { BueroError } from "@/buero/daten/basis";
import { xrechnungFuer } from "@/buero/daten/rechnungen";

// The issued invoice as XRechnung 3.0 (UBL), for download. Signed-in users only.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUserForAction();
  } catch {
    return new Response("Bitte melden Sie sich an.", { status: 401 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Nicht gefunden.", { status: 404 });
  try {
    const { nummer, xml } = await xrechnungFuer(id);
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nummer}.xml"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof BueroError) return new Response(error.message, { status: 409 });
    throw error;
  }
}
