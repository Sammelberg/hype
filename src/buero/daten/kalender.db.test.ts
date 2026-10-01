// @vitest-environment node
// Termine against DATABASE_URL: German days and times in, instants stored, the same days and
// times out, and found by the span they overlap. Removes its „test-“ Termine afterwards.
import { like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { db } from "../../cms/db/client";
import { termine } from "../db/schema";
import { createTermin, getTermin, listTermine, terminEingabe, updateTermin } from "./kalender";

const leer = { ort: null, notiz: null, kundeId: null, bisDatum: null, von: null, bis: null };

afterAll(async () => {
  await db.delete(termine).where(like(termine.titel, "test-%"));
});

describe.skipIf(!process.env.DATABASE_URL)("Termine", () => {
  it("keep a timed Termin's German day and times, across the clock change", async () => {
    const eingabe = {
      ...leer,
      titel: "test-abnahme",
      datum: "2026-10-25",
      ganztags: false,
      von: "09:00",
      bis: "10:30",
      ort: "Freiburg",
    };
    const id = await createTermin(eingabe);
    const t = (await getTermin(id))!;
    expect(t.beginn.toISOString()).toBe("2026-10-25T08:00:00.000Z");
    expect(terminEingabe(t)).toEqual(eingabe);
  });

  it("span several days all day, and are found on each", async () => {
    const id = await createTermin({
      ...leer,
      titel: "test-messe",
      datum: "2026-11-10",
      bisDatum: "2026-11-12",
      ganztags: true,
    });
    for (const tag of ["2026-11-10", "2026-11-11", "2026-11-12"])
      expect((await listTermine(tag, tag)).map((x) => x.termin.id)).toContain(id);
    expect((await listTermine("2026-11-13", "2026-11-30")).map((x) => x.termin.id)).not.toContain(
      id,
    );
    const [e] = (await listTermine("2026-11-11", "2026-11-11")).filter((x) => x.termin.id === id);
    expect(e!.ereignis).toMatchObject({ von: "2026-11-10", bis: "2026-11-12", uhrzeit: null });
    await updateTermin(id, {
      ...leer,
      titel: "test-messe",
      datum: "2026-11-10",
      ganztags: false,
      von: "14:00",
    });
    expect(terminEingabe((await getTermin(id))!)).toMatchObject({ von: "14:00", bisDatum: null });
  });
});
