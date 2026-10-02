import { describe, expect, it } from "vitest";

import { PAGE_SCENES, PEN_H, PEN_W, penHorizon, sceneFor } from "./pen-horizon";

const KEYS = [...Object.keys(PAGE_SCENES), "/suche", "anfrage", "Zahlung", "x"];

const points = (line: string) =>
  [...line.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);

describe("penHorizon", () => {
  it("draws the same skyline for the same key and another one for another key", () => {
    expect(penHorizon("/leistungen")).toEqual(penHorizon("/leistungen"));
    expect(penHorizon("/leistungen").at(-1)!.firs).not.toEqual(
      penHorizon("/projekte").at(-1)!.firs,
    );
  });

  it("lays the ridges far to near: three, four for layered ranges, or as many as asked", () => {
    expect(penHorizon("/leistungen").map((r) => r.depth)).toEqual([0, 1, 2]);
    expect(penHorizon("/e-rechnung").map((r) => r.depth)).toEqual([0, 1, 2, 3]);
    expect(penHorizon("/e-rechnung", { ridges: 2 }).map((r) => r.depth)).toEqual([0, 1]);
  });

  it("gives the pages different scenes, every profile used", () => {
    const profiles = new Set(Object.values(PAGE_SCENES).map((s) => s.profile));
    expect(profiles.size).toBe(5);
    expect(sceneFor("/ueber-uns")).toEqual({ profile: "gipfel", motif: "turm" });
    expect(PAGE_SCENES[sceneFor("Zahlung").profile]).toBeUndefined();
  });

  it("runs every contour from edge to edge inside the picture", () => {
    for (const key of KEYS) {
      for (const ridge of penHorizon(key)) {
        const pts = points(ridge.line);
        expect(pts[0]![0]).toBe(0);
        expect(pts.at(-1)![0]).toBe(PEN_W);
        for (const [, y] of pts) {
          expect(y).toBeGreaterThan(0);
          expect(y).toBeLessThan(PEN_H);
        }
      }
    }
  });

  it("keeps every fir and motif inside the picture, so nothing reaches into the text", () => {
    for (const key of KEYS) {
      for (const ridge of penHorizon(key)) {
        for (const fir of ridge.firs) {
          expect(fir.y - fir.h).toBeGreaterThanOrEqual(1.9);
          expect(fir.y).toBeLessThanOrEqual(PEN_H);
        }
        for (const [, y] of points(ridge.motif?.strokes ?? "")) {
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(PEN_H);
        }
      }
    }
  });

  it("plants our three firs in groups, nearer ones taller, with meadows between", () => {
    for (const key of KEYS) {
      const ridges = penHorizon(key);
      const mean = (r: (typeof ridges)[number]) =>
        r.firs.reduce((s, f) => s + f.h, 0) / Math.max(1, r.firs.length);
      expect(mean(ridges.at(-1)!)).toBeGreaterThan(mean(ridges[0]!));
      const near = ridges.at(-1)!.firs;
      expect(near.slice(1).some((f, i) => f.x - near[i]!.x > 50)).toBe(true);
    }
    const designs = new Set(penHorizon("/leistungen").flatMap((r) => r.firs.map((f) => f.design)));
    expect([...designs].sort()).toEqual(["dicht", "konkav", "schlank"]);
  });

  it("puts a page's motif on one ridge and keeps firs off its place", () => {
    const ridges = penHorizon("/kontakt");
    const withMotif = ridges.filter((r) => r.motif);
    expect(withMotif).toHaveLength(1);
    expect(withMotif[0]!.motif!.outline).toMatch(/Z$/);
    expect(penHorizon("/leistungen").some((r) => r.motif)).toBe(false);
  });

  it("keeps a horizon light: under a hundred firs", () => {
    for (const key of KEYS) {
      const count = penHorizon(key).reduce((n, r) => n + r.firs.length, 0);
      expect(count).toBeLessThan(100);
      expect(count).toBeGreaterThan(15);
    }
  });

  it("closes each ridge along the bottom, so the nearer hides the farther", () => {
    const [ridge] = penHorizon("/kontakt");
    expect(ridge!.fill.startsWith(ridge!.line)).toBe(true);
    expect(ridge!.fill.endsWith(`L${PEN_W} ${PEN_H} L0 ${PEN_H} Z`)).toBe(true);
  });
});
