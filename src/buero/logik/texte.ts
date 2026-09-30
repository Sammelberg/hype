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
