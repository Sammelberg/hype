// @vitest-environment node
import { Document, Page, renderToBuffer, Text } from "@react-pdf/renderer";
import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFStream,
} from "pdf-lib";
import { createElement } from "react";
import { beforeAll, describe, expect, it } from "vitest";

import { FONT_FAMILY } from "./schrift";
import { toPdfA3b, toZugferdPdf } from "./pdfa";

const XML = '<?xml version="1.0" encoding="UTF-8"?><rsm:CrossIndustryInvoice/>';
const META = {
  title: "Rechnung RE-2026-0101",
  author: "Lichtwerk Film & Foto GmbH",
  createdAt: new Date("2026-09-14T08:00:00.000Z"),
};

async function tinyPdf(): Promise<Uint8Array> {
  const page = createElement(
    Page,
    { size: "A4" },
    createElement(
      Text,
      { style: { fontFamily: FONT_FAMILY } },
      "Rechnung RE-2026-0101 · 3.184,58 €",
    ),
  );
  return new Uint8Array(await renderToBuffer(createElement(Document, null, page)));
}

const latin1 = (bytes: Uint8Array) => Buffer.from(bytes).toString("latin1");
const streamText = (stream: PDFStream) =>
  new TextDecoder().decode(
    stream instanceof PDFRawStream ? decodePDFRawStream(stream).decode() : stream.getContents(),
  );

let hybrid: Uint8Array;
let plain: Uint8Array;
let doc: PDFDocument;

beforeAll(async () => {
  const source = await tinyPdf();
  hybrid = await toZugferdPdf(source, XML, META);
  plain = await toPdfA3b(source, META);
  doc = await PDFDocument.load(hybrid, { updateMetadata: false });
});

describe("toZugferdPdf — embedded invoice XML", () => {
  const fileSpec = () => {
    const af = doc.catalog.lookup(PDFName.of("AF"), PDFArray);
    return af.lookup(0, PDFDict);
  };

  it("associates factur-x.xml with the document via /AF, relationship Alternative", () => {
    const spec = fileSpec();
    expect(spec.get(PDFName.of("AFRelationship"))).toBe(PDFName.of("Alternative"));
    expect(spec.lookup(PDFName.of("F"))?.toString()).toBe("(factur-x.xml)");
  });

  it("lists it in the EmbeddedFiles name tree", () => {
    const names = doc.catalog.lookup(PDFName.of("Names"), PDFDict);
    const files = names.lookup(PDFName.of("EmbeddedFiles"), PDFDict);
    const entries = files.lookup(PDFName.of("Names"), PDFArray);
    expect(entries.lookup(1, PDFDict)).toBe(fileSpec());
  });

  it("stores the XML byte for byte as text/xml with size and dates", () => {
    const ef = fileSpec().lookup(PDFName.of("EF"), PDFDict);
    const file = ef.lookup(PDFName.of("F"), PDFStream);
    expect(streamText(file)).toBe(XML);
    expect(file.dict.get(PDFName.of("Subtype"))).toBe(PDFName.of("text/xml"));
    const params = file.dict.lookup(PDFName.of("Params"), PDFDict);
    expect(params.lookup(PDFName.of("Size"))?.toString()).toBe(String(XML.length));
    expect(params.lookup(PDFName.of("CreationDate"))?.toString()).toBe("(D:20260914080000Z)");
  });
});

describe("toZugferdPdf — PDF/A-3b markers", () => {
  const metadata = () => doc.catalog.lookup(PDFName.of("Metadata"), PDFStream);

  it("XMP is uncompressed and carries PDF/A-3b plus the Factur-X fields", () => {
    const stream = metadata();
    expect(stream.dict.get(PDFName.of("Filter"))).toBeUndefined();
    const xmp = streamText(stream);
    expect(xmp).toContain("<pdfaid:part>3</pdfaid:part>");
    expect(xmp).toContain("<pdfaid:conformance>B</pdfaid:conformance>");
    expect(xmp).toContain("<pdfaSchema:prefix>fx</pdfaSchema:prefix>");
    expect(xmp).toContain("<fx:DocumentType>INVOICE</fx:DocumentType>");
    expect(xmp).toContain("<fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>");
    expect(xmp).toContain("<xmp:CreateDate>2026-09-14T08:00:00Z</xmp:CreateDate>");
  });

  it("the Info dictionary says the same as the XMP", () => {
    expect(doc.getTitle()).toBe("Rechnung RE-2026-0101");
    expect(doc.getAuthor()).toBe("Lichtwerk Film & Foto GmbH");
    expect(doc.getCreator()).toBe("kern");
    expect(doc.getProducer()).toBe("kern (pdf-lib)");
    expect(doc.getCreationDate()?.toISOString()).toBe("2026-09-14T08:00:00.000Z");
    const xmp = streamText(metadata());
    expect(xmp).toContain("<xmp:CreatorTool>kern</xmp:CreatorTool>");
    expect(xmp).toContain("<pdf:Producer>kern (pdf-lib)</pdf:Producer>");
  });

  it("sRGB OutputIntent with the ICC profile", () => {
    const intents = doc.catalog.lookup(PDFName.of("OutputIntents"), PDFArray);
    const intent = intents.lookup(0, PDFDict);
    expect(intent.get(PDFName.of("S"))).toBe(PDFName.of("GTS_PDFA1"));
    const profile = intent.lookup(PDFName.of("DestOutputProfile"), PDFStream);
    expect(profile.dict.lookup(PDFName.of("N"))?.toString()).toBe("3");
  });

  it("PDF 1.7 header, a file identifier, a classic xref table", () => {
    const raw = latin1(hybrid);
    expect(raw.startsWith("%PDF-1.7")).toBe(true);
    expect(doc.context.trailerInfo.ID).toBeDefined();
    expect(raw).not.toContain("/ObjStm");
    expect(raw).not.toMatch(/\/Type\s*\/XRef/);
    expect(raw).toMatch(/\nxref\n/);
  });
});

describe("toPdfA3b — archive copy without XML", () => {
  it("is PDF/A-3b without attachment and without Factur-X", async () => {
    const archive = await PDFDocument.load(plain, { updateMetadata: false });
    expect(archive.catalog.get(PDFName.of("AF"))).toBeUndefined();
    const xmp = streamText(archive.catalog.lookup(PDFName.of("Metadata"), PDFStream));
    expect(xmp).toContain("<pdfaid:part>3</pdfaid:part>");
    expect(xmp).not.toContain("factur-x");
  });
});
