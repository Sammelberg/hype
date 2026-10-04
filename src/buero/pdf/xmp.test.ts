import { describe, expect, it } from "vitest";

import { buildXmp } from "./xmp";

const BASE = {
  title: "Rechnung RE-2026-0101",
  author: "Lichtwerk Film & Foto GmbH",
  creatorTool: "kern",
  producer: "kern (pdf-lib)",
  createdAt: new Date("2026-09-14T08:00:00.123Z"),
  modifiedAt: new Date("2026-09-14T09:30:15.000Z"),
};

describe("buildXmp — PDF/A-3b identification", () => {
  const xmp = buildXmp(BASE);

  it("is one packet with the byte order mark in `begin`", () => {
    expect(xmp.startsWith('<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>')).toBe(true);
    expect(xmp.endsWith('<?xpacket end="w"?>')).toBe(true);
  });

  it("declares part 3, conformance B", () => {
    expect(xmp).toContain("<pdfaid:part>3</pdfaid:part>");
    expect(xmp).toContain("<pdfaid:conformance>B</pdfaid:conformance>");
  });

  it("mirrors the Info fields, escaped, dates without milliseconds", () => {
    expect(xmp).toContain('<rdf:li xml:lang="x-default">Rechnung RE-2026-0101</rdf:li>');
    expect(xmp).toContain("<rdf:li>Lichtwerk Film &amp; Foto GmbH</rdf:li>");
    expect(xmp).toContain("<xmp:CreatorTool>kern</xmp:CreatorTool>");
    expect(xmp).toContain("<pdf:Producer>kern (pdf-lib)</pdf:Producer>");
    expect(xmp).toContain("<xmp:CreateDate>2026-09-14T08:00:00Z</xmp:CreateDate>");
    expect(xmp).toContain("<xmp:ModifyDate>2026-09-14T09:30:15Z</xmp:ModifyDate>");
  });

  it("a plain PDF/A carries no Factur-X", () => {
    expect(xmp).not.toContain("factur-x");
    expect(xmp).not.toContain("pdfaExtension");
  });
});

describe("buildXmp — Factur-X extension (the defect ported from boden)", () => {
  const xmp = buildXmp({ ...BASE, facturX: { conformanceLevel: "EN 16931" } });

  it("declares the fx schema in pdfaExtension:schemas", () => {
    expect(xmp).toContain("<pdfaExtension:schemas>");
    expect(xmp).toContain(
      "<pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>",
    );
    expect(xmp).toContain("<pdfaSchema:prefix>fx</pdfaSchema:prefix>");
  });

  it("declares the four properties as external Text", () => {
    for (const name of ["DocumentFileName", "DocumentType", "Version", "ConformanceLevel"]) {
      expect(xmp).toMatch(
        new RegExp(
          `<pdfaProperty:name>${name}</pdfaProperty:name>\\s*<pdfaProperty:valueType>Text</pdfaProperty:valueType>\\s*<pdfaProperty:category>external</pdfaProperty:category>`,
        ),
      );
    }
  });

  it("carries the values Mustang reads", () => {
    expect(xmp).toContain('xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#"');
    expect(xmp).toContain("<fx:DocumentType>INVOICE</fx:DocumentType>");
    expect(xmp).toContain("<fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>");
    expect(xmp).toContain("<fx:Version>1.0</fx:Version>");
    expect(xmp).toContain("<fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>");
  });
});
