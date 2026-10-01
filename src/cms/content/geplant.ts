// Scheduled publishing: pages and projects whose `publish_at` has come are published as if the
// owner had pressed „Veröffentlichen“ — each in its own transaction with its audit entry. The
// server's timer reaches this through /next/geplant (pnpm cms:geplant), which also revalidates.
import { and, isNotNull, lte } from "drizzle-orm";

import { audited } from "../audit/log";
import type { Actor } from "../audit/types";
import { db } from "../db/client";
import { pages, projekte } from "../db/schema";
import { publishPage } from "./pages";
import { publishProjekt } from "./projekte";

export const ZEITPLAN: Actor = { id: null, email: "Zeitplan" };

export type GeplantErgebnis = {
  veroeffentlicht: { art: "seite" | "projekt"; id: number; pfad: string }[];
  fehler: { art: "seite" | "projekt"; id: number; meldung: string }[];
  pfade: string[];
};

export async function veroeffentlicheFaellige(jetzt: Date = new Date()): Promise<GeplantErgebnis> {
  const [seiten, projekteFaellig] = await Promise.all([
    db
      .select({ id: pages.id })
      .from(pages)
      .where(and(isNotNull(pages.publishAt), lte(pages.publishAt, jetzt))),
    db
      .select({ id: projekte.id })
      .from(projekte)
      .where(and(isNotNull(projekte.publishAt), lte(projekte.publishAt, jetzt))),
  ]);
  const ergebnis: GeplantErgebnis = { veroeffentlicht: [], fehler: [], pfade: [] };
  for (const { id } of seiten) {
    try {
      const r = await audited(
        (tx) => publishPage(id, null, tx),
        (x) => ({
          actor: ZEITPLAN,
          action: "seite.veroeffentlicht",
          target: { type: "seite", id },
          details: { pfad: x.pathsAfter[0], geplant: true },
        }),
      );
      ergebnis.veroeffentlicht.push({ art: "seite", id, pfad: r.pathsAfter[0] ?? "" });
      ergebnis.pfade.push(...r.pathsBefore, ...r.pathsAfter);
    } catch (error) {
      ergebnis.fehler.push({ art: "seite", id, meldung: (error as Error).message });
    }
  }
  for (const { id } of projekteFaellig) {
    try {
      const r = await audited(
        (tx) => publishProjekt(id, null, tx),
        (x) => ({
          actor: ZEITPLAN,
          action: "projekt.veroeffentlicht",
          target: { type: "projekt", id },
          details: { pfad: x.pathsAfter[0], geplant: true },
        }),
      );
      ergebnis.veroeffentlicht.push({ art: "projekt", id, pfad: r.pathsAfter[0] ?? "" });
      ergebnis.pfade.push(...r.pathsBefore, ...r.pathsAfter);
    } catch (error) {
      ergebnis.fehler.push({ art: "projekt", id, meldung: (error as Error).message });
    }
  }
  return ergebnis;
}
