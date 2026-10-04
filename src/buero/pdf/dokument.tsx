// The invoice as a PDF: the same sheet as the HTML print view (admin/_components/buero/
// rechnungs-dokument.tsx), both reading rechnungsBlatt (logik/blatt.ts) — this file only lays it out
// on A4 with react-pdf. A draft carries „ENTWURF“ across every page.
import { Document, Page, Text, View } from "@react-pdf/renderer";

import { type Blatt } from "../logik/blatt";
import { s } from "./stil";

/** Non-breaking spaces so „§ 19“, „Abs. 1“ and „19 %“ never split across lines. */
const zusammen = (text: string) =>
  text.replace(/(§|Abs\.|Nr\.) (?=\d)/g, "$1 ").replace(/(\d) (%)/g, "$1 $2");

export function RechnungPdf({
  blatt,
  verkaeufer,
  entwurf,
}: {
  blatt: Blatt;
  verkaeufer: string;
  entwurf: boolean;
}) {
  return (
    <Document title={blatt.name} author={verkaeufer} subject={blatt.titel} language="de">
      <Page size="A4" style={s.seite}>
        {entwurf ? (
          <Text style={s.wasserzeichen} fixed>
            ENTWURF
          </Text>
        ) : null}
        <View style={s.inhalt}>
          <View style={s.kopf}>
            <View style={s.anschrift}>
              <Text style={s.absenderZeile}>{blatt.absenderZeile}</Text>
              {(blatt.adresse ?? []).map((zeile, i) => (
                <Text key={i} style={s.adressZeile}>
                  {zeile}
                </Text>
              ))}
            </View>
            <View>
              <Text style={s.verkaeufer}>{verkaeufer}</Text>
              <View style={s.meta}>
                {blatt.meta.map((zeile) => (
                  <View key={zeile.label} style={s.metaZeile}>
                    <Text style={s.metaLabel}>{zeile.label}</Text>
                    <Text style={s.metaWert}>{zeile.wert}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <Text style={s.titel}>{blatt.ueberschrift}</Text>
          {blatt.korrektur ? <Text style={s.absatz}>{blatt.korrektur}</Text> : null}
          {blatt.einleitung ? <Text style={s.absatz}>{blatt.einleitung}</Text> : null}

          <View style={s.tabelle}>
            {/* fixed inside the table: repeated at the top of every page it runs onto. */}
            <View style={s.tabellenKopf} fixed>
              <Text style={s.spPos}>Pos.</Text>
              <Text style={s.spText}>Leistung</Text>
              <Text style={s.spMenge}>Menge</Text>
              <Text style={s.spPreis}>Einzelpreis</Text>
              {blatt.mitUst ? <Text style={s.spUst}>USt</Text> : null}
              <Text style={s.spBetrag}>Betrag</Text>
            </View>
            {blatt.posten.map((p) => (
              <View key={p.pos} style={s.tabellenZeile} wrap={false}>
                <Text style={s.spPos}>{p.pos}</Text>
                <Text style={s.spText}>{p.bezeichnung}</Text>
                <Text style={s.spMenge}>{p.menge}</Text>
                <Text style={s.spPreis}>{p.einzelpreis}</Text>
                {blatt.mitUst ? <Text style={s.spUst}>{zusammen(p.ust)}</Text> : null}
                <Text style={s.spBetrag}>{p.betrag}</Text>
              </View>
            ))}
          </View>

          <View style={s.summen} wrap={false}>
            {blatt.summen.map((summe) => (
              <View key={summe.label} style={summe.stark ? s.summeStark : s.summe}>
                <View>
                  <Text>{zusammen(summe.label)}</Text>
                  {summe.zusatz ? <Text style={s.summenZusatz}>{summe.zusatz}</Text> : null}
                </View>
                <Text>{summe.wert}</Text>
              </View>
            ))}
          </View>

          {blatt.hinweise.map((text) => (
            <Text key={text} style={s.hinweis}>
              {zusammen(text)}
            </Text>
          ))}
          {blatt.schlusstext ? <Text style={s.hinweis}>{blatt.schlusstext}</Text> : null}
        </View>

        <Text
          style={s.seitenzahl}
          fixed
          render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`}
        />
        <View style={s.fuss} fixed>
          {blatt.fuss.map((spalte, i) => (
            <View key={i} style={s.fussSpalte}>
              {spalte.map((zeile, j) => (
                <Text key={j}>{zeile}</Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
