import { describe, expect, it } from "vitest";

import { sameOrigin } from "./same-origin";

const headers = (entries: Record<string, string>) => new Headers(entries);

describe("sameOrigin", () => {
  it("accepts a page of the site behind the https entrance", () => {
    expect(
      sameOrigin(
        headers({ origin: "https://schwarzwaldsystems.de", host: "schwarzwaldsystems.de" }),
      ),
    ).toBe(true);
  });

  it("accepts the standalone server reached as localhost", () => {
    expect(sameOrigin(headers({ origin: "http://localhost:3002", host: "localhost:3002" }))).toBe(
      true,
    );
  });

  it("prefers the forwarded host", () => {
    expect(
      sameOrigin(
        headers({
          origin: "https://schwarzwaldsystems.de",
          host: "schwarzwald-app:3000",
          "x-forwarded-host": "schwarzwaldsystems.de",
        }),
      ),
    ).toBe(true);
  });

  it("refuses another site", () => {
    expect(
      sameOrigin(headers({ origin: "https://example.com", host: "schwarzwaldsystems.de" })),
    ).toBe(false);
  });

  it("refuses a request without origin, or with one that is no URL", () => {
    expect(sameOrigin(headers({ host: "schwarzwaldsystems.de" }))).toBe(false);
    expect(sameOrigin(headers({ origin: "null", host: "schwarzwaldsystems.de" }))).toBe(false);
  });
});
