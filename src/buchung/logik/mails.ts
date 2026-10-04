// The booking mails' texts: to the customer when a Buchung is confirmed, held for an invoice,
// asked for or cancelled, the reminders before the party and the question afterwards, and the
// owner's note about each new one. Plain text, Sie, short sentences; facts as a list a person can
// check. Pure: the sending lives in daten/post.ts.
import { preisText } from "./preis";
import type { BuchungStatus, PreisPosition } from "./typen";
import { terminText } from "./zeit";

export type MailBuchung = {
  nummer: string;
  status: BuchungStatus;
  figuren: string[];
  paket: string | null;
  beginn: Date;
  adresse: string;
  kontaktName: string;
  kindName: string | null;
  rechnungAn: string | null;
  positionen: PreisPosition[];
  summeCent: number | null;
  anzahlungCent: number | null;
  /** The customer's page; null when the link cannot be sent (sealed under an old key). */
  link: string | null;
};

export type Mail = { subject: string; text: string };

const termin = (d: Date) => {
  const t = terminText(d);
  return `${t.wochentag}, ${t.tag}, ${t.uhrzeit} Uhr`;
};
const kurzTermin = (d: Date) => {
  const t = terminText(d);
  return `${t.tag}, ${t.uhrzeit} Uhr`;
};
const wer = (b: MailBuchung) => (b.figuren.length > 0 ? b.figuren.join(" und ") : "Ihre Figur");

function eckdaten(b: MailBuchung, terminTitel = "Termin") {
  return [
    `Buchung: ${b.nummer}`,
    `Figur: ${wer(b)}`,
    ...(b.paket ? [`Paket: ${b.paket}`] : []),
    `${terminTitel}: ${termin(b.beginn)}`,
    ...(b.adresse ? [`Ort: ${b.adresse}`] : []),
  ];
}

function preis(b: MailBuchung, bezahlt: boolean) {
  if (b.positionen.length === 0) return [];
  const zeilen = b.positionen.map(
    (p) => `  ${p.bezeichnung}: ${p.cent === 0 ? "inklusive" : preisText(p.cent)}`,
  );
  if (b.summeCent === null)
    return ["Preis:", ...zeilen, "  Den Gesamtpreis nennen wir Ihnen mit dem Angebot."];
  const anzahlung = b.anzahlungCent ?? 0;
  return [
    "Preis:",
    ...zeilen,
    `  Summe: ${preisText(b.summeCent)}`,
    ...(anzahlung > 0
      ? bezahlt
        ? [
            `  Anzahlung bezahlt: ${preisText(anzahlung)}`,
            `  Noch offen: ${preisText(b.summeCent - anzahlung)}`,
          ]
        : [`  Anzahlung: ${preisText(anzahlung)}`]
      : []),
  ];
}

const link = (b: MailBuchung, satz: string) => (b.link ? [satz, b.link] : []);

function brief(b: MailBuchung, siteName: string, absaetze: string[][]): string {
  return [
    `Guten Tag ${b.kontaktName},`,
    ...absaetze.filter((a) => a.length > 0).map((a) => a.join("\n")),
    `Viele Grüße\n${siteName}`,
  ].join("\n\n");
}

/** The Anzahlung arrived (or the owner confirmed): the party is booked. Carries the .ics. */
export function bestaetigungMail(b: MailBuchung, siteName: string): Mail {
  return {
    subject: `Gebucht: ${wer(b)} am ${kurzTermin(b.beginn)}`,
    text: brief(b, siteName, [
      ["Ihre Feier ist gebucht. Wir freuen uns darauf!"],
      eckdaten(b),
      preis(b, true),
      link(b, "Ihre Buchung mit allen Angaben und den Bedingungen für Absagen:"),
      ["Den Termin für Ihren Kalender finden Sie im Anhang."],
    ]),
  };
}

/** A Kita or company pays by invoice: the slot is held until the Anzahlung is paid. */
export function reservierungMail(b: MailBuchung, siteName: string): Mail {
  return {
    subject: `Reserviert: ${wer(b)} am ${kurzTermin(b.beginn)}`,
    text: brief(b, siteName, [
      [
        `Wir halten den Termin für ${b.rechnungAn ?? "Sie"} und schicken die Rechnung über die Anzahlung. Sobald sie bezahlt ist, ist der Termin fest gebucht.`,
      ],
      eckdaten(b),
      preis(b, false),
      link(b, "Ihre Buchung:"),
    ]),
  };
}

/** An Anfrage arrived: the owner plans it and answers with an offer. */
export function anfrageMail(b: MailBuchung, siteName: string): Mail {
  return {
    subject: `Ihre Anfrage: ${wer(b)} am ${kurzTermin(b.beginn)}`,
    text: brief(b, siteName, [
      [
        "Danke für Ihre Anfrage. Wir prüfen den Termin und melden uns mit einem Angebot. Bezahlt wird erst, wenn Sie zusagen.",
      ],
      eckdaten(b, "Wunschtermin"),
      preis(b, false),
      link(b, "Ihre Anfrage:"),
    ]),
  };
}

/** The Buchung was cancelled; what it costs or what comes back. */
export function stornoMail(
  b: MailBuchung,
  siteName: string,
  folgen: { gebuehrCent: number; erstattungCent: number },
): Mail {
  const geld =
    folgen.erstattungCent > 0
      ? `Sie bekommen ${preisText(folgen.erstattungCent)} zurück, auf dem Weg, auf dem Sie bezahlt haben.`
      : folgen.gebuehrCent > 0
        ? `Nach den Bedingungen für Absagen fallen ${preisText(folgen.gebuehrCent)} an.`
        : "Es fallen keine Kosten an.";
  return {
    subject: `Storniert: Buchung ${b.nummer}`,
    text: brief(b, siteName, [
      [`Ihre Buchung ${b.nummer} für ${termin(b.beginn)} ist storniert.`, geld],
      ["Möchten Sie einen anderen Termin? Wir freuen uns, wenn Sie wieder buchen."],
    ]),
  };
}

/** A week ahead: what we need on the day. */
export function erinnerungMail(b: MailBuchung, siteName: string): Mail {
  return {
    subject: `In einer Woche: ${wer(b)} kommt${b.kindName ? ` zu ${b.kindName}` : ""}`,
    text: brief(b, siteName, [
      [`in einer Woche ist es so weit: ${termin(b.beginn)}.`],
      [
        "Damit alles klappt:",
        "  - eine freie Ecke oder ein Zimmer zum Umziehen",
        "  - ein Parkplatz in der Nähe, wenn möglich",
        "  - Platz zum Spielen, ein beiseitegeschobener Tisch reicht",
      ],
      eckdaten(b),
      link(b, "Stimmt die Adresse? Hier sehen Sie alles noch einmal:"),
    ]),
  };
}

/** The day before. */
export function vortagMail(b: MailBuchung, siteName: string): Mail {
  return {
    subject: `Morgen kommt ${wer(b)}`,
    text: brief(b, siteName, [
      [
        `morgen ist die Feier. ${wer(b)} klingelt pünktlich um ${terminText(b.beginn).uhrzeit} Uhr.`,
      ],
      eckdaten(b),
      ["Ändert sich etwas, antworten Sie einfach auf diese E-Mail."],
    ]),
  };
}

/** The day after: how it was. */
export function bewertungMail(b: MailBuchung, siteName: string): Mail {
  return {
    subject: "Wie war die Feier?",
    text: brief(b, siteName, [
      [
        `wir hoffen, ${b.kindName ? `${b.kindName} hatte` : "die Kinder hatten"} einen schönen Tag mit ${wer(b)}.`,
        "Wie war es? Schreiben Sie uns ein paar Sätze als Antwort auf diese E-Mail. Mit Ihrer Erlaubnis zeigen wir sie anderen Eltern auf unserer Website, nur mit Vornamen.",
      ],
    ]),
  };
}

/** The owner's note: a new Buchung, an Anfrage, a cancellation. */
export function hinweisMail(b: MailBuchung, was: string, adminUrl: string): Mail {
  return {
    subject: `${was}: ${b.nummer}, ${kurzTermin(b.beginn)}`,
    text: [
      `${was} über die Website.`,
      "",
      ...eckdaten(b, b.status === "anfrage" ? "Wunschtermin" : "Termin"),
      `Kontakt: ${b.kontaktName}`,
      ...(b.rechnungAn ? [`Rechnung an: ${b.rechnungAn}`] : []),
      ...(b.summeCent !== null ? [`Summe: ${preisText(b.summeCent)}`] : []),
      "",
      `In der Verwaltung: ${adminUrl}`,
    ].join("\n"),
  };
}
