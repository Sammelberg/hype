import { requireRoleForAction } from "@/cms/auth/guard";
import { BueroError } from "@/buero/daten/basis";
import { pdfFuer } from "@/buero/daten/rechnungen";

// The issued invoice as PDF (ZUGFeRD when its data allow), the archived copy, for download.
// Admins only.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleForAction("admin");
  } catch (error) {
    return new Response((error as Error).message, { status: 401 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Nicht gefunden.", { status: 404 });
  try {
    const { nummer, pdf } = await pdfFuer(id);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nummer}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof BueroError) return new Response(error.message, { status: 409 });
    throw error;
  }
}
