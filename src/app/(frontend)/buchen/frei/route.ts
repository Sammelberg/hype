import { freieStarts } from "@/buchung/daten/buchen";

// The free starts for the booking form's calendar: GET /buchen/frei?figuren=1,2&paket=3&extras=&
// ort=5&ab=2026-11-02&tage=42 → { starts: { "2026-11-14": ["10:00", …], … } }. Read only, never
// cached: every booking changes the answer.

const ID = /^[1-9]\d{0,8}$/;
const liste = (wert: string | null) =>
  (wert ?? "")
    .split(",")
    .filter(Boolean)
    .map((x) => (ID.test(x) ? Number(x) : NaN));

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const figurIds = liste(p.get("figuren"));
  const extraIds = liste(p.get("extras"));
  const paketId = Number(p.get("paket"));
  const stadtId = Number(p.get("ort"));
  const ab = p.get("ab") ?? "";
  const tage = Number(p.get("tage") ?? "42");
  const gueltig =
    figurIds.length >= 1 &&
    figurIds.length <= 2 &&
    [...figurIds, ...extraIds, paketId, stadtId].every((n) => Number.isInteger(n) && n > 0) &&
    extraIds.length <= 20 &&
    /^\d{4}-\d{2}-\d{2}$/.test(ab) &&
    Number.isInteger(tage) &&
    tage >= 1 &&
    tage <= 62;
  if (!gueltig) return Response.json({ fehler: "Ungültige Anfrage." }, { status: 400 });

  const starts = await freieStarts({ figurIds, paketId, extraIds, stadtId, ab, tage }, new Date());
  return Response.json({ starts }, { headers: { "Cache-Control": "no-store" } });
}
