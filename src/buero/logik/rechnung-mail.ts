// The covering e-mail of an invoice (Anrede „Sie“). It prefills the send dialog; the owner may
// change address, subject and text before sending. The invoice itself is the attachment: the
// XRechnung, and the printed PDF if the owner adds it.
import { datumDe } from "./ablauf";
import { euro } from "./geld";

export interface RechnungMail {
  subject: string;
  text: string;
}

export function rechnungMail(input: {
  typ: "rechnung" | "storno";
  nummer: string;
  /** Gross in cents. */
  brutto: number;
  faelligAm: string | null;
  /** The invoice this Storno cancels. */
  korrigiertNummer?: string | null;
  empfaenger: { name: string; privat: boolean };
  absender: string;
}): RechnungMail {
  const anrede = input.empfaenger.privat
    ? `Guten Tag ${input.empfaenger.name},`
    : "Sehr geehrte Damen und Herren,";
  const titel = input.typ === "storno" ? "Stornorechnung" : "Rechnung";
  const satz =
    input.typ === "storno"
      ? `anbei erhalten Sie unsere Stornorechnung ${input.nummer}${
          input.korrigiertNummer
            ? ` zur Rechnung ${input.korrigiertNummer}. Sie hebt diese Rechnung vollständig auf.`
            : "."
        }`
      : `anbei erhalten Sie unsere Rechnung ${input.nummer} über ${euro(input.brutto)}${
          input.faelligAm ? `, zahlbar bis ${datumDe(input.faelligAm)}` : ""
        }.`;
  return {
    subject: `${titel} ${input.nummer} – ${input.absender}`,
    text: [
      anrede,
      "",
      satz,
      "",
      "Bei Fragen antworten Sie einfach auf diese E-Mail.",
      "",
      "Mit freundlichen Grüßen",
      input.absender,
    ].join("\n"),
  };
}
