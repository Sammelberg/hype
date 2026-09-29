import { describe, expect, it } from "vitest";

import { breadcrumbSchema, pageTrail } from "./breadcrumbs";

describe("pageTrail", () => {
  it("starts at the home page and follows the nested-docs breadcrumbs", () => {
    expect(
      pageTrail([
        { label: "Branchen", url: "/branchen" },
        { label: "Handwerk", url: "/branchen/handwerk" },
      ]),
    ).toEqual([
      { name: "Startseite", path: "/" },
      { name: "Branchen", path: "/branchen" },
      { name: "Handwerk", path: "/branchen/handwerk" },
    ]);
  });

  it("skips crumbs without a label or url", () => {
    expect(pageTrail([{ label: null, url: "/x" }, { label: "Y" }])).toEqual([
      { name: "Startseite", path: "/" },
    ]);
  });

  it("returns only the home page without breadcrumbs", () => {
    expect(pageTrail(null)).toEqual([{ name: "Startseite", path: "/" }]);
  });
});

describe("breadcrumbSchema", () => {
  it("numbers the trail from 1 with absolute item URLs", () => {
    const schema = breadcrumbSchema(
      [
        { name: "Startseite", path: "/" },
        { name: "Projekte", path: "/projekte" },
      ],
      (path) => `https://example.de${path}`,
    );
    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Startseite", item: "https://example.de/" },
        { "@type": "ListItem", position: 2, name: "Projekte", item: "https://example.de/projekte" },
      ],
    });
  });
});
