import { describe, expect, it } from "vitest";

import { siteNav } from "./site-nav";

const page = (id: number, slug: string, title: string, parent?: number, url?: string) => ({
  id,
  slug,
  title,
  parent: parent ?? null,
  breadcrumbs: [{ url: url ?? `/${slug}` }],
});

const PAGES = [
  page(1, "startseite", "Startseite"),
  page(2, "impressum", "Impressum"),
  page(3, "datenschutz", "Datenschutz"),
  page(4, "ueber-uns", "Über uns"),
  page(5, "team", "Team", 4, "/ueber-uns/team"),
  page(6, "leistungen", "Leistungen"),
  page(7, "web-anwendungen", "Web-Anwendungen", 6, "/leistungen/web-anwendungen"),
  page(8, "branchen", "Branchen"),
  page(9, "handwerk", "Handwerk", 8, "/branchen/handwerk"),
  page(10, "presse", "Presse"),
];

describe("siteNav", () => {
  const nav = siteNav(PAGES, [{ title: "Meistrum für Krone Parkett", slug: "meistrum" }]);

  it("lists the sections in the site's order, new CMS sections before Kontakt", () => {
    expect(nav.map((s) => s.label)).toEqual([
      "Leistungen",
      "Branchen",
      "Projekte",
      "Über uns",
      "Presse",
      "Kontakt",
    ]);
  });

  it("leaves out the home page and the legal pages", () => {
    const hrefs = nav.flatMap((s) => [s.href, ...s.children.map((c) => c.href)]);
    expect(hrefs).not.toContain("/startseite");
    expect(hrefs).not.toContain("/impressum");
    expect(hrefs).not.toContain("/datenschutz");
  });

  it("puts each page under its section, with its nested URL", () => {
    expect(nav.find((s) => s.href === "/ueber-uns")?.children).toEqual([
      { label: "Team", href: "/ueber-uns/team" },
    ]);
    expect(nav.find((s) => s.href === "/leistungen")?.children).toEqual([
      { label: "Web-Anwendungen", href: "/leistungen/web-anwendungen" },
    ]);
  });

  it("lists the projects under Projekte", () => {
    expect(nav.find((s) => s.href === "/projekte")?.children).toEqual([
      { label: "Meistrum für Krone Parkett", href: "/projekte/meistrum" },
    ]);
  });
});
