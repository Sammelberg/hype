import { normalizePath, resolveRedirect } from "./redirects";

describe("normalizePath", () => {
  it.each([
    ["/alt/pfad", "/alt/pfad"],
    ["alt/pfad/", "/alt/pfad"],
    ["https://example.com/alt?x=1#y", "/alt"],
    ["/Leistungen/Beratung", "/leistungen/beratung"],
    ["/", "/"],
    ["", "/"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe("resolveRedirect", () => {
  it("resolves a reference to the home page to /", () => {
    expect(
      resolveRedirect({
        type: "301",
        to: {
          type: "reference",
          reference: { relationTo: "pages", value: { slug: "startseite" } },
        },
      }),
    ).toEqual({ destination: "/", permanent: true });
  });

  it("resolves a reference to a nested page via its breadcrumbs", () => {
    expect(
      resolveRedirect({
        type: "302",
        to: {
          type: "reference",
          reference: {
            relationTo: "pages",
            value: { slug: "team", breadcrumbs: [{ url: "/ueber-uns/team" }] },
          },
        },
      }),
    ).toEqual({ destination: "/ueber-uns/team", permanent: false });
  });

  it("keeps custom URLs as entered", () => {
    expect(
      resolveRedirect({ type: "308", to: { type: "custom", url: "https://example.org/neu" } }),
    ).toEqual({ destination: "https://example.org/neu", permanent: true });
  });

  it("defaults to a temporary redirect", () => {
    expect(resolveRedirect({ to: { type: "custom", url: "/neu" } })).toMatchObject({
      permanent: false,
    });
  });

  it("returns null when the target is missing or unpopulated", () => {
    expect(resolveRedirect({ to: { type: "custom", url: "" } })).toBeNull();
    expect(
      resolveRedirect({ to: { type: "reference", reference: { relationTo: "pages", value: 7 } } }),
    ).toBeNull();
    expect(
      resolveRedirect({
        to: { type: "reference", reference: { relationTo: "unknown", value: { slug: "x" } } },
      }),
    ).toBeNull();
  });
});
