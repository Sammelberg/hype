// The invoice PDF, server only (fonts and the ICC profile are read from disk). An issued invoice
// becomes ZUGFeRD — PDF/A-3b with the CII XML inside — when its XRechnung data are complete, else
// plain PDF/A-3b; buero/daten/rechnungen.ts archives the result on first use.
import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { type DokumentDaten, rechnungsBlatt } from "../logik/blatt";
import { RechnungPdf } from "./dokument";
import { toPdfA3b, toZugferdPdf } from "./pdfa";
import "./schrift";

// renderToBuffer is typed for a bare <Document>; RechnungPdf returns one. Rendered as an element,
// not called, so React Compiler output stays valid.
const alsDokument = (element: ReactElement) => element as ReactElement<DocumentProps>;

/** The sheet as react-pdf renders it (no PDF/A yet): drafts, offers, tests. */
export async function blattPdf(daten: DokumentDaten): Promise<Uint8Array> {
  const blatt = rechnungsBlatt(daten);
  return new Uint8Array(
    await renderToBuffer(
      alsDokument(
        createElement(RechnungPdf, {
          blatt,
          verkaeufer: daten.verkaeufer.name,
          entwurf: daten.nummer === null,
        }),
      ),
    ),
  );
}

/** An issued invoice for the archive and the customer: ZUGFeRD with `xml`, PDF/A-3b without. */
export async function rechnungsPdf(
  daten: DokumentDaten,
  xml: string | null,
  ausgestellt: Date,
): Promise<Uint8Array> {
  const roh = await blattPdf(daten);
  const meta = {
    title: rechnungsBlatt(daten).name,
    author: daten.verkaeufer.name,
    createdAt: ausgestellt,
  };
  return xml ? toZugferdPdf(roh, xml, meta) : toPdfA3b(roh, meta);
}
