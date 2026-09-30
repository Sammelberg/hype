import { describe, expect, it } from "vitest";

import { clientIp } from "./client-ip";

const headers = (value?: string) => new Headers(value ? { "x-forwarded-for": value } : {});

describe("clientIp", () => {
  it("trusts only the entry our proxy appended", () => {
    expect(clientIp(headers("203.0.113.9"))).toBe("203.0.113.9");
    expect(clientIp(headers("6.6.6.6, 203.0.113.9"))).toBe("203.0.113.9");
    expect(clientIp(headers("6.6.6.6 , 2001:db8::1 "))).toBe("2001:db8::1");
  });

  it("falls back to one shared key without the header", () => {
    expect(clientIp(headers())).toBe("unbekannt");
    expect(clientIp(headers(" , "))).toBe("unbekannt");
  });
});
