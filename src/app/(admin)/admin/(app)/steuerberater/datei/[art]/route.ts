import { requireRoleForAction } from "@/cms/auth/guard";
import { writeAudit } from "@/cms/audit/log";
import { db } from "@/cms/db/client";
import { journal } from "@/buero/daten/export";
import { getFirma } from "@/buero/daten/firma";
import {
  datevBuchungsstapel,
  journalCsv,
  ustCsv,
  ustNachMonat,
  zeitraum,
} from "@/buero/logik/export";

const ARTEN = ["journal", "ust", "datev"] as const;

// The adviser's files for a period (?zeitraum=2026-Q3): the invoice journal, VAT per month, a
// DATEV booking batch. Admins only; each export goes into the audit log.
export async function GET(request: Request, { params }: { params: Promise<{ art: string }> }) {
  let user;
  try {
    user = await requireRoleForAction("admin");
  } catch (error) {
    return new Response((error as Error).message, { status: 401 });
  }
  const art = (await params).art as (typeof ARTEN)[number];
  const z = zeitraum(new URL(request.url).searchParams.get("zeitraum") ?? "");
  if (!ARTEN.includes(art) || !z) return new Response("Nicht gefunden.", { status: 404 });

  const rechnungen = await journal(z.von, z.bis);
  let inhalt: string;
  let name: string;
  if (art === "journal") {
    inhalt = journalCsv(rechnungen);
    name = `Rechnungsausgangsbuch_${z.schluessel}.csv`;
  } else if (art === "ust") {
    inhalt = ustCsv(ustNachMonat(rechnungen));
    name = `Umsatzsteuer_${z.schluessel}.csv`;
  } else {
    const { firma } = await getFirma();
    if (!firma.datev)
      return new Response(
        "Für den DATEV-Export fehlen Berater- und Mandantennummer. Tragen Sie sie unter Firmendaten ein.",
        { status: 409 },
      );
    const jetzt = new Date();
    const erzeugt = jetzt.toISOString().replace(/\D/g, "").slice(0, 17);
    inhalt = datevBuchungsstapel({
      rechnungen,
      einstellungen: firma.datev,
      von: z.von,
      bis: z.bis,
      erzeugt,
    });
    name = `EXTF_Buchungsstapel_${z.schluessel}.csv`;
  }
  await writeAudit(db, {
    actor: user,
    action: "export.steuerberater",
    details: { art, zeitraum: z.schluessel, rechnungen: rechnungen.length },
  });
  return new Response(inhalt, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
