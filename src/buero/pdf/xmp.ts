// The one XMP packet of every archived document PDF (from port/src/lib/invoicing/einvoice/xmp.ts).
// boden wrote it twice (ZUGFeRD embed and PDF/A step) and neither copy declared Factur-X, so a
// validator could not tell a hybrid invoice from a plain PDF/A. Here the PDF/A identification, the fields mirrored from the Info dictionary
// and — for a hybrid invoice — the Factur-X extension schema come from one function.
// `&` first, or `&lt;` would double.
const escXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const FACTUR_X_NAMESPACE = "urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#";
export const FACTUR_X_FILENAME = "factur-x.xml";

export interface XmpInput {
  title: string;
  author: string;
  /** Written into the Info dictionary too; PDF/A wants both to agree. */
  creatorTool: string;
  producer: string;
  createdAt: Date;
  modifiedAt: Date;
  /** Present for a hybrid invoice: the Factur-X fields describing the embedded XML. */
  facturX?: { conformanceLevel: "EN 16931" };
}

/** ISO date without milliseconds — the precision of the PDF date in the Info dictionary. */
export const xmpDate = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");

// PDF/A-3 (ISO 19005-3, 6.6.2.3) accepts custom XMP properties only when an extension schema in
// the same packet declares them. Property names and value types follow the Factur-X 1.0 spec.
const FACTUR_X_PROPERTIES = [
  ["DocumentFileName", "The name of the embedded XML document"],
  ["DocumentType", "The type of the hybrid document in capital letters, e.g. INVOICE or ORDER"],
  ["Version", "The actual version of the standard applying to the embedded XML document"],
  ["ConformanceLevel", "The conformance level of the embedded XML document"],
] as const;

function facturXExtension(): string {
  const properties = FACTUR_X_PROPERTIES.map(
    ([name, description]) => `
              <rdf:li rdf:parseType="Resource">
                <pdfaProperty:name>${name}</pdfaProperty:name>
                <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                <pdfaProperty:category>external</pdfaProperty:category>
                <pdfaProperty:description>${description}</pdfaProperty:description>
              </rdf:li>`,
  ).join("");
  return `
    <rdf:Description rdf:about=""
        xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
        xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
        xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>${FACTUR_X_NAMESPACE}</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>${properties}
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>`;
}

function facturXValues(conformanceLevel: string): string {
  return `
    <rdf:Description rdf:about="" xmlns:fx="${FACTUR_X_NAMESPACE}">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>${FACTUR_X_FILENAME}</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>${escXml(conformanceLevel)}</fx:ConformanceLevel>
    </rdf:Description>`;
}

/**
 * The XMP packet. The stream holding it must stay uncompressed (6.6.2.1), and the `begin`
 * attribute carries the byte order mark as the XMP spec requires.
 */
export function buildXmp(input: XmpInput): string {
  const created = xmpDate(input.createdAt);
  const modified = xmpDate(input.modifiedAt);
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${escXml(input.title)}</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>${escXml(input.author)}</rdf:li></rdf:Seq></dc:creator>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreatorTool>${escXml(input.creatorTool)}</xmp:CreatorTool>
      <xmp:CreateDate>${created}</xmp:CreateDate>
      <xmp:ModifyDate>${modified}</xmp:ModifyDate>
      <xmp:MetadataDate>${modified}</xmp:MetadataDate>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>${escXml(input.producer)}</pdf:Producer>
    </rdf:Description>${input.facturX ? facturXExtension() + facturXValues(input.facturX.conformanceLevel) : ""}
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}
