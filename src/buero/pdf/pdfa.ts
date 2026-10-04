// PDF/A-3b (ISO 19005-3) for issued documents, and the ZUGFeRD / Factur-X hybrid: the rendered
// invoice PDF with the CII XML (logik/zugferd.ts) embedded as `factur-x.xml`. From
// port/src/lib/invoicing/einvoice/pdf-a3b.ts.
//
// What the conversion adds to the react-pdf output: one XMP packet (xmp.ts) mirrored by a fresh
// Info dictionary, an sRGB OutputIntent with the ICC profile, a file identifier, and for the
// hybrid the embedded file with its /AF association. Fonts cannot be fixed here — the template
// embeds LiberationSans (schrift.ts); a glyph outside it would bring in a non-embedded font.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHeader,
  PDFHexString,
  PDFName,
  PDFRef,
  PDFString,
} from "pdf-lib";

import { buildXmp, FACTUR_X_FILENAME } from "./xmp";

export interface PdfMeta {
  /** Document title, e.g. „Rechnung RE-2026-0001“ (dc:title and Info /Title). */
  title: string;
  /** The issuing firm (dc:creator and Info /Author). */
  author: string;
  /** Issue moment; defaults to now. */
  createdAt?: Date;
}

/** The software, not the firm — the firm is the author. */
const CREATOR_TOOL = "kern";
const PRODUCER = "kern (pdf-lib)";

const ICC_PATH = join(process.cwd(), "src/buero/pdf/icc/sRGB_IEC61966-2-1.icc");
let iccProfile: Uint8Array | undefined;

// Read once; a missing profile throws instead of writing an OutputIntent without one, which
// veraPDF rejects (6.2.3).
const loadIccProfile = () => (iccProfile ??= readFileSync(ICC_PATH));

/** PDF dates carry seconds; XMP gets the same instant so the two agree exactly (6.6.3). */
const toSecond = (date: Date) => new Date(Math.floor(date.getTime() / 1000) * 1000);

function setMetadata(pdf: PDFDocument, meta: PdfMeta, now: Date, facturX: boolean) {
  const createdAt = toSecond(meta.createdAt ?? now);
  const modifiedAt = toSecond(now);
  const { context } = pdf;

  // A fresh Info dictionary: react-pdf's Producer, Creator and dates would contradict the XMP.
  const oldInfo = context.trailerInfo.Info;
  if (oldInfo instanceof PDFRef) context.delete(oldInfo);
  context.trailerInfo.Info = context.register(context.obj({}));
  pdf.setTitle(meta.title);
  pdf.setAuthor(meta.author);
  pdf.setCreator(CREATOR_TOOL);
  pdf.setProducer(PRODUCER);
  pdf.setCreationDate(createdAt);
  pdf.setModificationDate(modifiedAt);

  const xmp = buildXmp({
    title: meta.title,
    author: meta.author,
    creatorTool: CREATOR_TOOL,
    producer: PRODUCER,
    createdAt,
    modifiedAt,
    ...(facturX ? { facturX: { conformanceLevel: "EN 16931" as const } } : {}),
  });
  // No /Filter: the metadata stream must stay readable without decoding (6.6.2.1).
  const stream = context.stream(new TextEncoder().encode(xmp), {
    Type: "Metadata",
    Subtype: "XML",
  });
  pdf.catalog.set(PDFName.of("Metadata"), context.register(stream));
}

function setOutputIntent(pdf: PDFDocument) {
  const { context } = pdf;
  const profile = context.flateStream(loadIccProfile(), { N: 3, Alternate: "DeviceRGB" });
  const intent = context.obj({
    Type: "OutputIntent",
    S: "GTS_PDFA1",
    OutputConditionIdentifier: PDFString.of("sRGB IEC61966-2.1"),
    Info: PDFString.of("sRGB IEC61966-2.1"),
    RegistryName: PDFString.of("http://www.color.org"),
    DestOutputProfile: context.register(profile),
  });
  pdf.catalog.set(PDFName.of("OutputIntents"), context.obj([context.register(intent)]));
}

/** The trailer /ID is mandatory in PDF/A (6.1.3); react-pdf writes one, keep it if present. */
function ensureFileId(pdf: PDFDocument, seed: string) {
  const { context } = pdf;
  if (context.trailerInfo.ID) return;
  const id = PDFHexString.of(createHash("md5").update(seed).digest("hex"));
  context.trailerInfo.ID = context.obj([id, id]);
}

function embedInvoiceXml(pdf: PDFDocument, xml: string, createdAt: Date, now: Date) {
  const { context } = pdf;
  const bytes = new TextEncoder().encode(xml);
  const file = context.flateStream(bytes, {
    Type: "EmbeddedFile",
    Subtype: "text/xml",
    Params: {
      Size: bytes.length,
      CreationDate: PDFString.fromDate(toSecond(createdAt)),
      ModDate: PDFString.fromDate(toSecond(now)),
    },
  });
  // Alternative: the XML is an equivalent rendering of the visible invoice — the relationship
  // Factur-X and ZUGFeRD 2.x require for the EN 16931 profile.
  const fileSpec = context.register(
    context.obj({
      Type: "Filespec",
      F: PDFString.of(FACTUR_X_FILENAME),
      UF: PDFHexString.fromText(FACTUR_X_FILENAME),
      EF: { F: context.register(file) },
      Desc: PDFString.of("Factur-X / ZUGFeRD invoice data (EN 16931)"),
      AFRelationship: "Alternative",
    }),
  );

  const names = pdf.catalog.lookupMaybe(PDFName.of("Names"), PDFDict) ?? context.obj({});
  names.set(
    PDFName.of("EmbeddedFiles"),
    context.obj({ Names: [PDFHexString.fromText(FACTUR_X_FILENAME), fileSpec] }),
  );
  pdf.catalog.set(PDFName.of("Names"), names);
  const associated = PDFArray.withContext(context);
  associated.push(fileSpec);
  pdf.catalog.set(PDFName.of("AF"), associated);
}

async function convert(input: Uint8Array, meta: PdfMeta, xml: string | null): Promise<Uint8Array> {
  // updateMetadata: false — pdf-lib would otherwise stamp its own Producer and dates.
  const pdf = await PDFDocument.load(input, { updateMetadata: false });
  const now = new Date();
  // AF and embedded-file associations are PDF 2.0 features adopted by PDF/A-3 on top of PDF 1.7;
  // react-pdf writes a 1.3 header.
  pdf.context.header = PDFHeader.forVersion(1, 7);
  setMetadata(pdf, meta, now, xml !== null);
  setOutputIntent(pdf);
  ensureFileId(pdf, `${meta.title}\n${xml ?? ""}`);
  if (xml !== null) embedInvoiceXml(pdf, xml, meta.createdAt ?? now, now);
  // A classic xref table instead of object streams: readable by older tools over the ten-year
  // retention (§ 147 AO); both are valid PDF/A.
  return pdf.save({ useObjectStreams: false });
}

/** PDF/A-3b without attachment — for an invoice whose XRechnung data are incomplete, an offer. */
export function toPdfA3b(pdf: Uint8Array, meta: PdfMeta): Promise<Uint8Array> {
  return convert(pdf, meta, null);
}

/** ZUGFeRD / Factur-X hybrid: PDF/A-3b with `factur-x.xml` (CII from `zugferdXml`) embedded. */
export function toZugferdPdf(pdf: Uint8Array, xml: string, meta: PdfMeta): Promise<Uint8Array> {
  return convert(pdf, meta, xml);
}
