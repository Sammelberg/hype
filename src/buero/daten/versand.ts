// Sending an issued invoice by e-mail through the owner's mailbox — one way among others: the
// print view and the XRechnung download stay as they are, for whoever sends from their own mail
// program. Attachments: the archived PDF (ZUGFeRD when its data allow) and the archived XRechnung
// — pdfFuer and xrechnungFuer, so the file sent is the file kept — or, instead of the archived PDF,
// one the owner chose. The mail lands in the mail log
// beside the invoice and in the customer's history.
import { db, type Db, type Tx } from "../../cms/db/client";
import { sendMail } from "../../cms/mail/send";
import { isEmail } from "../../lib/email/providers";
import { kundenHistorie } from "../db/schema";
import { BueroError } from "./basis";
import { getRechnung, pdfFuer, xrechnungFuer } from "./rechnungen";

// The PDF travels in a server action (2 MB at most, next.config.ts).
export const PDF_MAX_BYTES = 1_800_000;

export interface RechnungVersand {
  id: number;
  to: string;
  subject: string;
  text: string;
  xrechnung: boolean;
  /** The archived PDF of the invoice. */
  pdf: boolean;
  /** A PDF the owner chose, sent instead of the archived one. */
  eigenesPdf: { name: string; bytes: Uint8Array } | null;
}

type Senden = typeof sendMail;

const pdfName = (name: string, nummer: string) => {
  const base = name
    .replace(/\.pdf$/i, "")
    .replace(/[^\p{L}\p{N}._ -]+/gu, "")
    .trim();
  return `${base || nummer}.pdf`;
};

export async function versendeRechnung(
  input: RechnungVersand,
  wer: { userId: number | null; autor: string | null },
  { senden = sendMail, client = db }: { senden?: Senden; client?: Db | Tx } = {},
) {
  const to = input.to.trim();
  if (!isEmail(to)) throw new BueroError("Bitte eine gültige Empfängeradresse.", "to");
  const subject = input.subject.trim();
  if (!subject || subject.length > 300)
    throw new BueroError("Bitte einen Betreff (höchstens 300 Zeichen).", "subject");
  const text = input.text.trim();
  if (!text || text.length > 10_000)
    throw new BueroError("Bitte eine Nachricht (höchstens 10.000 Zeichen).", "text");

  const found = await getRechnung(input.id, client);
  if (!found) throw new BueroError("Die Rechnung gibt es nicht mehr.");
  const { rechnung } = found;
  if (rechnung.status === "entwurf" || !rechnung.nummer)
    throw new BueroError("Ein Entwurf wird nicht versandt: stellen Sie die Rechnung zuerst.");

  const anhaenge: { filename: string; content: Uint8Array | string; contentType: string }[] = [];
  if (input.xrechnung) {
    const { nummer, xml } = await xrechnungFuer(input.id, client);
    anhaenge.push({ filename: `${nummer}.xml`, content: xml, contentType: "application/xml" });
  }
  if (input.eigenesPdf) {
    const { bytes } = input.eigenesPdf;
    if (bytes.byteLength > PDF_MAX_BYTES)
      throw new BueroError("Das PDF ist zu groß (höchstens 1,8 MB).", "eigenesPdf");
    // The file's first bytes decide, not its name.
    if (Buffer.from(bytes.subarray(0, 5)).toString("latin1") !== "%PDF-")
      throw new BueroError("Die Datei ist kein PDF.", "eigenesPdf");
    anhaenge.unshift({
      filename: pdfName(input.eigenesPdf.name, rechnung.nummer),
      content: bytes,
      contentType: "application/pdf",
    });
  } else if (input.pdf) {
    const { nummer, pdf } = await pdfFuer(input.id, client);
    anhaenge.unshift({ filename: `${nummer}.pdf`, content: pdf, contentType: "application/pdf" });
  }
  if (anhaenge.length === 0)
    throw new BueroError("Bitte hängen Sie das PDF oder die XRechnung an.", "pdf");

  await senden(
    { to, subject, text, attachments: anhaenge },
    { kind: "rechnung", sentById: wer.userId, target: { type: "rechnung", id: input.id } },
  );

  const titel = rechnung.typ === "storno" ? "Stornorechnung" : "Rechnung";
  await client.insert(kundenHistorie).values({
    kundeId: rechnung.kundeId,
    art: "email",
    text: `${titel} ${rechnung.nummer} per E-Mail an ${to} gesendet (${anhaenge
      .map((a) => a.filename)
      .join(", ")}).`,
    autor: wer.autor,
  });
  return { to, nummer: rechnung.nummer, anhaenge: anhaenge.map((a) => a.filename) };
}
