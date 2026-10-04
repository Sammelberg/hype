// The .ics attached to the confirmation mail (RFC 5545): times in UTC with Z, so every calendar
// shows the party at its German time whatever the clocks do. Pure.

const utf8 = new TextEncoder();
const MAX = 75;

const stempel = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

const text = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Folds a content line at 75 bytes; continuation lines start with a space. Whole characters only.
function falte(zeile: string) {
  const teile: string[] = [];
  let aktuell = "";
  let bytes = 0;
  for (const zeichen of zeile) {
    const n = utf8.encode(zeichen).length;
    if (bytes + n > MAX) {
      teile.push(aktuell);
      aktuell = " ";
      bytes = 1;
    }
    aktuell += zeichen;
    bytes += n;
  }
  teile.push(aktuell);
  return teile.join("\r\n");
}

export function icsTermin(e: {
  uid: string;
  beginn: Date;
  ende: Date;
  titel: string;
  ort: string;
  beschreibung: string;
  jetzt: Date;
}): string {
  const zeilen = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hype Agency//Buchung//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${stempel(e.jetzt)}`,
    `DTSTART:${stempel(e.beginn)}`,
    `DTEND:${stempel(e.ende)}`,
    `SUMMARY:${text(e.titel)}`,
    `LOCATION:${text(e.ort)}`,
    `DESCRIPTION:${text(e.beschreibung)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return zeilen.map(falte).join("\r\n") + "\r\n";
}
