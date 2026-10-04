import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { getFirma } from "@/buero/daten/firma";
import { centAusBetrag } from "@/buero/logik/geld";
import {
  getEinstellungen,
  listExtras,
  listFiguren,
  listPakete,
  listStaedte,
  listZonen,
} from "@/buchung/daten/stammdaten";
import { NeueBuchung } from "../_components/neue-buchung";

export const metadata: Metadata = { title: "Neue Buchung" };

export default async function NeueBuchungPage() {
  await requireRole("admin");
  const [figuren, pakete, extras, staedte, zonen, regeln, { firma }] = await Promise.all([
    listFiguren(),
    listPakete(),
    listExtras(),
    listStaedte(),
    listZonen(),
    getEinstellungen(),
    getFirma(),
  ]);
  const aufschlag = new Map(zonen.map((z) => [z.code, centAusBetrag(z.aufschlag)]));
  return (
    <NeueBuchung
      figuren={figuren.filter((f) => f.aktiv).map((f) => ({ id: f.id, name: f.name }))}
      pakete={pakete
        .filter((p) => p.aktiv && !p.nurAnfrage && p.preis !== null)
        .map((p) => ({
          id: p.id,
          name: p.name,
          preisCent: centAusBetrag(p.preis),
          figurenAnzahl: p.figurenAnzahl,
        }))}
      extras={extras
        .filter((x) => x.aktiv && !x.nurAnfrage)
        .map((x) => ({
          id: x.id,
          name: x.name,
          preisCent: centAusBetrag(x.preis),
          zusatzFigur: x.zusatzFigur,
        }))}
      staedte={staedte.map((s) => ({
        id: s.id,
        name: s.name,
        zone: s.zoneCode,
        aufschlagCent: aufschlag.get(s.zoneCode) ?? 0,
      }))}
      anzahlungProzent={regeln.anzahlungProzent}
      kleinunternehmer={firma.kleinunternehmer}
    />
  );
}
