// Print layout of the invoice PDF: A4, black on white, greys for secondary text and rules. Neutral
// like the template; a project with its own look changes the colours here. Measures from port's
// styles.ts: the left margin follows DIN 5008 (25 mm), the address sits where a window envelope
// shows it, the bottom keeps room for the fixed footer.
import { StyleSheet } from "@react-pdf/renderer";

import { FONT_FAMILY } from "./schrift";

export const FARBEN = {
  text: "#111111",
  gedaempft: "#555555",
  blass: "#8a8a8a",
  linie: "#cfcfcf",
  wasserzeichen: "#eeeeee",
} as const;

const RAND_LINKS = 70;
const RAND_RECHTS = 50;
const FUSS_HOEHE = 96;

export const s = StyleSheet.create({
  seite: {
    paddingTop: 36,
    paddingBottom: FUSS_HOEHE,
    paddingLeft: RAND_LINKS,
    paddingRight: RAND_RECHTS,
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    color: FARBEN.text,
  },
  // Line height on the content, not the page: on the page react-pdf 4.9 drops the dynamic
  // page-number Text (port's measurement).
  inhalt: { fontSize: 9.5, lineHeight: 1.4 },
  wasserzeichen: {
    position: "absolute",
    top: 360,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 110,
    lineHeight: 1,
    fontWeight: "bold",
    color: FARBEN.wasserzeichen,
    transform: "rotate(-35deg)",
  },

  kopf: { flexDirection: "row", justifyContent: "space-between" },
  verkaeufer: { fontSize: 13, lineHeight: 1.25, fontWeight: "bold", textAlign: "right" },
  // The address 45 mm from the top edge, where a DIN 5008 window envelope shows it.
  anschrift: { width: 240, marginTop: 92, minHeight: 90 },
  absenderZeile: {
    fontSize: 6.5,
    color: FARBEN.blass,
    paddingBottom: 2,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: FARBEN.linie,
  },
  adressZeile: { fontSize: 10 },
  meta: { width: 200, marginTop: 12 },
  metaZeile: { flexDirection: "row", marginBottom: 1.5 },
  metaLabel: { width: 92, color: FARBEN.gedaempft, fontSize: 8.5 },
  metaWert: { flex: 1, textAlign: "right", fontSize: 8.5 },

  titel: { marginTop: 14, fontSize: 16, lineHeight: 1.25, fontWeight: "bold" },
  absatz: { marginTop: 6 },

  tabelle: { marginTop: 16 },
  tabellenKopf: {
    flexDirection: "row",
    paddingBottom: 4,
    borderBottomWidth: 0.75,
    borderBottomColor: FARBEN.text,
    fontSize: 8,
    fontWeight: "bold",
  },
  tabellenZeile: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: FARBEN.linie,
    fontSize: 9,
  },
  spPos: { width: 26 },
  spText: { flex: 1, paddingRight: 8 },
  spMenge: { width: 70, textAlign: "right" },
  spPreis: { width: 72, textAlign: "right" },
  spUst: { width: 36, textAlign: "right" },
  spBetrag: { width: 78, textAlign: "right" },

  summen: { alignSelf: "flex-end", width: 260, marginTop: 10 },
  summe: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
  summeStark: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 0.75,
    borderTopColor: FARBEN.text,
    fontSize: 10.5,
    fontWeight: "bold",
  },
  summenZusatz: { fontSize: 8, color: FARBEN.gedaempft },

  hinweis: { marginTop: 8 },

  seitenzahl: {
    position: "absolute",
    bottom: FUSS_HOEHE - 26,
    // Both edges set: a dynamic Text without a width is laid out zero wide and never shows.
    left: RAND_LINKS,
    right: RAND_RECHTS,
    textAlign: "right",
    fontSize: 7.5,
    color: FARBEN.blass,
  },
  fuss: {
    position: "absolute",
    bottom: 28,
    left: RAND_LINKS,
    right: RAND_RECHTS,
    flexDirection: "row",
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: FARBEN.linie,
    fontSize: 7,
    lineHeight: 1.35,
    color: FARBEN.gedaempft,
  },
  fussSpalte: { flex: 1, paddingRight: 6 },
});
