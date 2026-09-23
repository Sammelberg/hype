import { normalizePath, resolveRedirect } from "./redirects";

describe("normalizePath", () => {
  it.each([
    ["/alt/pfad", "/alt/pfad"],
    ["alt/pfad/", "/alt/pfad"],
    ["https://example.com/alt?x=1#y", "/alt"],
    ["/Projekte/Museum", "/projekte/museum"],
    ["/", "/"],
    ["", "/"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe("resolveRedirect", () => {
  it("resolves a reference to a project", () => {
    expect(
      resolveRedirect({
        type: "301",
        to: {
          type: "reference",
          reference: { relationTo: "projects", value: { slug: "stadtmuseum-freiburg" } },
        },
      }),
    ).toEqual({ destination: "/projekte/stadtmuseum-freiburg", permanent: true });
  });

  it("resolves a reference to a nested page via its breadcrumbs", () => {
    expect(
      resolveRedirect({
        type: "302",
        to: {
          type: "reference",
          reference: {
            relationTo: "pages",
            value: { slug: "werdegang", breadcrumbs: [{ url: "/ueber-mich/werdegang" }] },
          },
        },
      }),
    ).toEqual({ destination: "/ueber-mich/werdegang", permanent: false });
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
      resolveRedirect({
        to: { type: "reference", reference: { relationTo: "projects", value: 7 } },
      }),
    ).toBeNull();
  });
});
