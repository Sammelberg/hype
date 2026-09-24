import { describe, expect, it } from "vitest";

import { buildInquiry, inquiryHref } from "./inquiry";

describe("buildInquiry", () => {
  it("writes one sentence per answered question", () => {
    expect(
      buildInquiry({
        services: ["Gestaltung", "Entwicklung"],
        scope: "Eine mittelgroße Website",
        timing: "In den nächsten drei Monaten",
      }),
    ).toBe(
      "Guten Tag,\n\n" +
        "ich interessiere mich für: Gestaltung und Entwicklung.\n" +
        "Umfang: Eine mittelgroße Website.\n" +
        "Zeitrahmen: In den nächsten drei Monaten.\n\n" +
        "Kurz zu meinem Vorhaben: ",
    );
  });

  it("joins three or more services with commas and „und“", () => {
    expect(buildInquiry({ services: ["A", "B", "C"] })).toContain("für: A, B und C.");
  });

  it("leaves out questions without an answer", () => {
    expect(buildInquiry({ services: [] })).toBe("Guten Tag,\n\nKurz zu meinem Vorhaben: ");
  });
});

describe("inquiryHref", () => {
  it("links to the contact page with the message as a query parameter", () => {
    expect(inquiryHref("a b&c")).toBe("/kontakt?nachricht=a+b%26c");
  });
});
