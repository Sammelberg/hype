// @vitest-environment node
// Runs against DATABASE_URL inside one transaction that is rolled back at the end.
import { describe, expect, it } from "vitest";

import { db, type Tx } from "../../cms/db/client";
import { media } from "../../cms/db/schema";
import { belegungen, darsteller } from "../db/schema";
import { BuchungFehler } from "./basis";
import {
  getDarsteller,
  getFigur,
  listFiguren,
  loescheDarsteller,
  loescheFigur,
  speichereDarsteller,
  speichereFigur,
  speicherePaket,
  speichereZone,
} from "./stammdaten";

class Rueckgabe extends Error {}
async function imRollback(fn: (tx: Tx) => Promise<void>) {
  try {
    await db.transaction(async (tx) => {
      await fn(tx);
      throw new Rueckgabe();
    });
  } catch (error) {
    if (!(error instanceof Rueckgabe)) throw error;
  }
}

const figur = (slug: string, fotos: number[] = []) => ({
  slug,
  name: "test-Eisprinzessin",
  kategorie: "prinzessinnen",
  alterVon: 3,
  alterBis: 8,
  sprachen: ["de"],
  kurz: "",
  beschreibung: "",
  programm: ["Tanz"],
  aktiv: true,
  sort: 0,
  fotos,
  metaTitle: "",
  metaDescription: "",
});

const bild = (tx: Tx, name: string) =>
  tx
    .insert(media)
    .values({
      filename: `test-${name}-${Date.now()}.webp`,
      mimeType: "image/webp",
      filesize: 1,
      alt: name,
    })
    .returning({ id: media.id })
    .then(([r]) => r!.id);

describe.skipIf(!process.env.DATABASE_URL)("Stammdaten (Datenbank)", () => {
  it("keeps a character's photos in the chosen order", async () => {
    await imRollback(async (tx) => {
      const [a, b] = [await bild(tx, "a"), await bild(tx, "b")];
      const { id } = await speichereFigur(null, figur("test-reihenfolge", [b, a]), tx);
      expect((await getFigur(id, tx))?.fotos).toEqual([b, a]);
      await speichereFigur(id, figur("test-reihenfolge", [a]), tx);
      expect((await getFigur(id, tx))?.fotos).toEqual([a]);
    });
  });

  it("lists characters with how many photos and performers each has", async () => {
    await imRollback(async (tx) => {
      const a = await bild(tx, "liste");
      const f = await speichereFigur(null, figur("test-liste", [a]), tx);
      await speichereDarsteller(
        null,
        {
          name: "test-Cara",
          email: "",
          telefon: "",
          aktiv: true,
          prioritaet: 10,
          notiz: "",
          figuren: [f.id],
        },
        tx,
      );
      const zeile = (await listFiguren(tx)).find((x) => x.id === f.id);
      expect(zeile).toMatchObject({ fotos: 1, darsteller: 1 });
    });
  });

  it("refuses a web address that is taken, naming the field", async () => {
    await imRollback(async (tx) => {
      await speichereFigur(null, figur("test-doppelt"), tx);
      await expect(speichereFigur(null, figur("test-doppelt"), tx)).rejects.toMatchObject({
        message: "Diese Adresse ist schon vergeben.",
        field: "slug",
      });
    });
  });

  it("stores which characters a performer plays", async () => {
    await imRollback(async (tx) => {
      const f = await speichereFigur(null, figur("test-rolle"), tx);
      const d = await speichereDarsteller(
        null,
        {
          name: "test-Anna",
          email: "",
          telefon: "",
          aktiv: true,
          prioritaet: 10,
          notiz: "",
          figuren: [f.id],
        },
        tx,
      );
      expect((await getDarsteller(d.id, tx))?.figuren).toEqual([f.id]);
    });
  });

  it("refuses to delete a performer with planned time, and suggests deactivating", async () => {
    await imRollback(async (tx) => {
      const [d] = await tx.insert(darsteller).values({ name: "test-Ben" }).returning();
      await tx.insert(belegungen).values({
        darstellerId: d!.id,
        art: "sperre",
        von: new Date("2026-12-01T10:00:00Z"),
        bis: new Date("2026-12-01T12:00:00Z"),
      });
      await expect(tx.transaction((t) => loescheDarsteller(d!.id, t))).rejects.toBeInstanceOf(
        BuchungFehler,
      );
    });
  });

  it("deletes a character that was never booked", async () => {
    await imRollback(async (tx) => {
      const { id } = await speichereFigur(null, figur("test-weg"), tx);
      await loescheFigur(id, tx);
      expect(await getFigur(id, tx)).toBeNull();
    });
  });

  it("stores prices as entered and keeps a zone's code fixed", async () => {
    await imRollback(async (tx) => {
      const p = await speicherePaket(
        null,
        {
          slug: "test-klassik",
          name: "test-Klassik",
          beschreibung: "",
          leistungen: [],
          dauerMin: 90,
          preis: 249.5,
          figurenAnzahl: 1,
          nurAnfrage: false,
          aktiv: true,
          sort: 0,
        },
        tx,
      );
      expect(p.id).toBeGreaterThan(0);
      const zone = {
        code: "TX",
        name: "test-Zone",
        aufschlag: 25,
        fahrtMinuten: 30,
        nurAnfrage: false,
        sort: 0,
      };
      await speichereZone(null, zone, tx);
      await expect(speichereZone("TX", { ...zone, code: "TY" }, tx)).rejects.toMatchObject({
        field: "code",
      });
    });
  });
});
