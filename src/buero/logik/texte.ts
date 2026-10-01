// What the admin calls each status, and what the button that leads there says.
import type { StatusVon } from "./ablauf";

export const AUFTRAG_STATUS: Record<StatusVon<"auftrag">, { name: string; schritt: string }> = {
  angebot: { name: "Angebot", schritt: "Zurück zum Angebot" },
  beauftragt: { name: "Beauftragt", schritt: "Auftrag erhalten" },
  in_arbeit: { name: "In Arbeit", schritt: "Arbeit beginnen" },
  abgenommen: { name: "Abgenommen", schritt: "Abnahme erfassen" },
  abgerechnet: { name: "Abgerechnet", schritt: "Als abgerechnet markieren" },
  storniert: { name: "Storniert", schritt: "Auftrag stornieren" },
};

export const VERTRAG_STATUS: Record<StatusVon<"vertrag">, { name: string; schritt: string }> = {
  entwurf: { name: "Entwurf", schritt: "" },
  aktiv: { name: "Aktiv", schritt: "Unterzeichnet: aktivieren" },
  gekuendigt: { name: "Gekündigt", schritt: "Kündigung erfassen" },
  beendet: { name: "Beendet", schritt: "Als beendet markieren" },
};

export const RECHNUNG_STATUS: Record<StatusVon<"rechnung">, { name: string }> = {
  entwurf: { name: "Entwurf" },
  gestellt: { name: "Offen" },
  bezahlt: { name: "Bezahlt" },
  storniert: { name: "Storniert" },
};

export const ANGEBOT_STATUS: Record<StatusVon<"angebot">, { name: string; schritt: string }> = {
  entwurf: { name: "Entwurf", schritt: "" },
  versendet: { name: "Versendet", schritt: "Angebot versenden" },
  angenommen: { name: "Angenommen", schritt: "Zusage erfassen" },
  abgelehnt: { name: "Abgelehnt", schritt: "Absage erfassen" },
};

/** The usual body of each reminder step; the owner may write their own instead. */
export function mahnText(a: {
  stufe: number;
  nummer: string;
  vom: string;
  faellig: string;
  frist: string;
  vorige: string | null;
}) {
  if (a.stufe === 0)
    return `sicher ist es Ihnen im Alltag durchgerutscht: Unsere Rechnung ${a.nummer} vom ${a.vom} war am ${a.faellig} fällig, und wir haben noch keinen Zahlungseingang festgestellt. Bitte überweisen Sie den offenen Betrag bis zum ${a.frist}. Falls Sie inzwischen gezahlt haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.`;
  if (a.stufe === 1)
    return `auf unsere Zahlungserinnerung${a.vorige ? ` vom ${a.vorige}` : ""} ist bisher keine Zahlung eingegangen. Die Rechnung ${a.nummer} vom ${a.vom} ist seit dem ${a.faellig} fällig. Bitte überweisen Sie den unten genannten Betrag bis zum ${a.frist}.`;
  return `trotz unserer Mahnung${a.vorige ? ` vom ${a.vorige}` : ""} ist die Rechnung ${a.nummer} vom ${a.vom} weiterhin offen. Wir bitten Sie letztmalig, den unten genannten Betrag bis zum ${a.frist} zu überweisen. Geht bis dahin keine Zahlung ein, beantragen wir ohne weitere Ankündigung einen gerichtlichen Mahnbescheid.`;
}
