import { LEISTUNG_DEFAULTS } from "./page-sections";
import { describe, expect, it } from "vitest";

import {
  breadcrumbsOf,
  canMove,
  descendantsOf,
  flattenTree,
  kindOf,
  pathOf,
  pathsOf,
  PROTECTED_SLUGS,
  ROUTED_PATHS,
  sectionsProblem,
  slugify,
  type TreeNode,
} from "./page-tree";

const tree: TreeNode[] = [
  { id: 1, slug: "startseite", title: "Startseite", parentId: null },
  { id: 4, slug: "ueber-uns", title: "Über uns", parentId: null },
  { id: 6, slug: "leistungen", title: "Leistungen", parentId: null },
  { id: 7, slug: "web-anwendungen", title: "Web-Anwendungen", parentId: 6 },
  { id: 12, slug: "arbeitsweise", title: "Unsere Arbeitsweise", parentId: 4 },
];

describe("pathOf", () => {
  it("gives the home page the root path", () => {
    expect(pathOf("startseite", null)).toBe("/");
  });
  it("joins the parent's path and the slug", () => {
    expect(pathOf("arbeitsweise", "/ueber-uns")).toBe("/ueber-uns/arbeitsweise");
  });
  it("does not double the slash under the home page", () => {
    expect(pathOf("news", "/")).toBe("/news");
  });
});

describe("pathsOf", () => {
  it("resolves every page regardless of list order", () => {
    const paths = pathsOf([...tree].reverse());
    expect(paths.get(7)).toBe("/leistungen/web-anwendungen");
    expect(paths.get(12)).toBe("/ueber-uns/arbeitsweise");
    expect(paths.get(1)).toBe("/");
  });
  it("treats a page whose parent is missing as top level", () => {
    expect(pathsOf([{ id: 9, slug: "verwaist", title: "x", parentId: 99 }]).get(9)).toBe(
      "/verwaist",
    );
  });
  it("survives a cycle in the data", () => {
    const paths = pathsOf([
      { id: 1, slug: "a", title: "a", parentId: 2 },
      { id: 2, slug: "b", title: "b", parentId: 1 },
    ]);
    expect(paths.get(1)).toMatch(/^\/b\/a$|^\/a$/);
    expect(paths.size).toBe(2);
  });
});

describe("breadcrumbsOf", () => {
  it("lists the ancestors down to the page itself", () => {
    expect(breadcrumbsOf(12, tree)).toEqual([
      { label: "Über uns", url: "/ueber-uns" },
      { label: "Unsere Arbeitsweise", url: "/ueber-uns/arbeitsweise" },
    ]);
  });
  it("is one crumb for a top-level page", () => {
    expect(breadcrumbsOf(6, tree)).toEqual([{ label: "Leistungen", url: "/leistungen" }]);
  });
});

describe("moving pages", () => {
  it("finds all descendants", () => {
    expect(descendantsOf(6, tree).map((n) => n.id)).toEqual([7]);
  });
  it("refuses to make a page its own ancestor", () => {
    expect(canMove(6, 7, tree)).toBe(false);
    expect(canMove(6, 6, tree)).toBe(false);
  });
  it("allows a move to another branch or to the top", () => {
    expect(canMove(7, 4, tree)).toBe(true);
    expect(canMove(7, null, tree)).toBe(true);
  });
});

describe("flattenTree", () => {
  it("lists children right after their parent with their depth", () => {
    const rows = flattenTree(tree, (a, b) => a.id - b.id);
    expect(rows.map((r) => `${r.depth}:${r.slug}`)).toEqual([
      "0:startseite",
      "0:ueber-uns",
      "1:arbeitsweise",
      "0:leistungen",
      "1:web-anwendungen",
    ]);
  });
});

describe("slugify", () => {
  it("writes umlauts as two letters and keeps single hyphens", () => {
    expect(slugify("Über uns – Arbeitsweise")).toBe("ueber-uns-arbeitsweise");
    expect(slugify("  Größe & Maß  ")).toBe("groesse-mass");
    expect(slugify("Café Déjà")).toBe("cafe-deja");
  });
});

describe("page kinds", () => {
  it("gives the pages with a route of their own their kind, every other page none", () => {
    expect(kindOf("startseite")).toBe("home");
    expect(kindOf("leistungen")).toBe("leistungen");
    expect(kindOf("projekte")).toBe("projekte");
    expect(kindOf("kontakt")).toBe("kontakt");
    expect(kindOf("ueber-uns")).toBe("content");
    expect([...ROUTED_PATHS].sort()).toEqual(["/", "/kontakt", "/leistungen", "/projekte"]);
  });

  it("makes every page right under /leistungen a service's page, by its parent", () => {
    expect(kindOf("web-anwendungen", "leistungen")).toBe("leistung");
    expect(kindOf("neue-leistung", "leistungen")).toBe("leistung");
    expect(kindOf("web-anwendungen", "ueber-uns")).toBe("content");
    expect(kindOf("web-anwendungen")).toBe("content");
    // A routed page keeps its kind wherever it stands.
    expect(kindOf("kontakt", "leistungen")).toBe("kontakt");
  });

  it("gives a service's page the service sections, and only it", () => {
    const leistung = { ...LEISTUNG_DEFAULTS };
    expect(sectionsProblem("geschaeftssysteme", leistung, "leistungen")).toBeNull();
    expect(sectionsProblem("geschaeftssysteme", null, "leistungen")).toBeNull();
    expect(sectionsProblem("ueber-uns", leistung, null)).toMatch(/keine festen Abschnitte/);
  });

  it("keeps the routed and the legal pages", () => {
    for (const slug of ["startseite", "leistungen", "projekte", "kontakt", "impressum"])
      expect(PROTECTED_SLUGS.has(slug)).toBe(true);
    expect(PROTECTED_SLUGS.has("ueber-uns")).toBe(false);
  });

  it("accepts sections only of the page's own kind", () => {
    const projekte = { kind: "projekte" as const, empty: null };
    expect(sectionsProblem("projekte", projekte)).toBeNull();
    expect(sectionsProblem("projekte", null)).toBeNull();
    expect(sectionsProblem("kontakt", projekte)).toMatch(/passen nicht/);
    expect(sectionsProblem("ueber-uns", projekte)).toMatch(/keine festen Abschnitte/);
    expect(sectionsProblem("ueber-uns", undefined)).toBeNull();
  });
});
