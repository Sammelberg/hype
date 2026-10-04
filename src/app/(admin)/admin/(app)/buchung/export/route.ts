import { exportZeilen } from "@/buchung/daten/buchungen";
import { buchungenCsv } from "@/buchung/logik/export";
import { berlinStart } from "@/buchung/logik/zeit";
import { writeAudit } from "@/cms/audit/log";
import { requireRoleForAction } from "@/cms/auth/guard";
import { db } from "@/cms/db/client";
import { tagePlus } from "@/buero/logik/ablauf";

// The bookings whose party lies in a period (?von=2026-11-01&bis=2026-11-30, both days included)
// as CSV for the tax adviser. Admins only; each export goes into the audit log.
export async function GET(request: Request) {
  let user;
  try {
    user = await requireRoleForAction("admin");
  } catch (error) {
    return new Response((error as Error).message, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const vonTag = params.get("von") ?? "";
  const bisTag = params.get("bis") ?? "";
  const von = berlinStart(vonTag, "00:00");
  const bis = berlinStart(bisTag, "00:00") ? berlinStart(tagePlus(bisTag, 1), "00:00") : null;
  if (!von || !bis || bis <= von)
    return new Response("Bitte einen gültigen Zeitraum angeben.", { status: 400 });

  const zeilen = await exportZeilen({ von, bis });
  await writeAudit(db, {
    actor: user,
    action: "export.steuerberater",
    details: { art: "buchungen", von: vonTag, bis: bisTag, buchungen: zeilen.length },
  });
  return new Response(buchungenCsv(zeilen), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="Buchungen_${vonTag}_${bisTag}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
