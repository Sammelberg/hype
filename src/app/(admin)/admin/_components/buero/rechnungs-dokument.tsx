import { RECHNUNGSARTEN, type Rechnungsart, schlussBetrag } from "@/buero/logik/abrechnung";
import { datumDe } from "@/buero/logik/ablauf";
import { euro, positionNetto, rechnungsSummen } from "@/buero/logik/geld";
import { EINHEITEN, type Einheit, type Empfaenger, type Firma } from "@/buero/logik/typen";
import { KLEINUNTERNEHMER_HINWEIS } from "@/buero/logik/xrechnung";
import { cn } from "@/lib/utils";

// The invoice as a sheet of paper (DIN 5008 order): the same component shows a draft live beside
// its form and prints an issued invoice — and, with `angebot`, an offer. It reads only its props — the numbers come from
// geld.ts, the same ones the invoice stores and the XRechnung carries.
export type DokumentDaten = {
  nummer: string | null;
  storno: boolean;
  korrigiert?: string | null;
  ausgestelltAm: string | null;
  faelligAm: string | null;
  leistungVon: string | null;
  leistungBis: string | null;
  verkaeufer: Firma;
  empfaenger: Empfaenger | null;
  kundennummer?: string | null;
  kleinunternehmer: boolean;
  einleitung: string | null;
  schlusstext: string | null;
  positionen: {
    bezeichnung: string;
    menge: number;
    einheit: Einheit;
    einzelpreis: number;
    ustSatz: number;
  }[];
  art?: Rechnungsart;
  /**
   * A final invoice: the invoices on account it deducts, in cents — with their net and VAT,
   * which §14 Abs. 5 UStG wants stated (null for none recorded).
   */
  abzuege?: { nummer: string; brutto: number; netto?: number | null; steuer?: number | null }[];
  /** An offer instead of an invoice: valid until this day (or open). */
  angebot?: { gueltigBis: string | null };
};

const menge = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 3 });
/** DE02 1203 0000 0000 2020 51: how people read and type an IBAN. */
const ibanLesbar = (iban: string) => iban.replace(/(.{4})/g, "$1 ").trim();
const d = (iso: string | null | undefined) => (iso ? datumDe(iso) : "—");

export function RechnungsDokument({
  daten,
  className,
}: {
  daten: DokumentDaten;
  className?: string;
}) {
  const v = daten.verkaeufer;
  const e = daten.empfaenger;
  const positionen = daten.positionen.filter(
    (p) => Number.isFinite(p.menge) && Number.isFinite(p.einzelpreis),
  );
  const summen = rechnungsSummen(positionen, daten.kleinunternehmer);
  const zeitraum =
    daten.leistungVon && daten.leistungBis && daten.leistungVon !== daten.leistungBis
      ? `${d(daten.leistungVon)} bis ${d(daten.leistungBis)}`
      : d(daten.leistungVon ?? daten.leistungBis);
  const angebot = daten.angebot;
  const abzuege = daten.abzuege ?? [];
  const { zahlbetrag } = schlussBetrag(
    summen.brutto,
    abzuege.map((a) => a.brutto),
  );
  const titel = angebot
    ? "Angebot"
    : daten.storno
      ? "Rechnungskorrektur (Storno)"
      : daten.art && daten.art !== "abo"
        ? RECHNUNGSARTEN[daten.art]
        : "Rechnung";
  const absender = [v.name, v.strasse, [v.plz, v.ort].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      aria-label={
        daten.nummer ? `${titel} ${daten.nummer}` : angebot ? "Angebotsentwurf" : "Rechnungsentwurf"
      }
      data-rechnungsblatt=""
      className={cn(
        "mx-auto flex w-full max-w-[210mm] flex-col gap-8 bg-white p-[12mm] text-[10pt] leading-snug text-zinc-900 shadow-sm",
        className,
      )}
    >
      <header className="grid grid-cols-[minmax(0,1fr)_auto] gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-[7.5pt] text-zinc-500 underline decoration-zinc-300">{absender}</p>
          <address className="not-italic">
            {e ? (
              <>
                {e.firma && e.firma !== e.name ? <p>{e.firma}</p> : null}
                <p>{e.name}</p>
                <p>{e.strasse}</p>
                <p>{[e.plz, e.ort].filter(Boolean).join(" ")}</p>
                {e.land !== "DE" ? <p>{e.land}</p> : null}
              </>
            ) : (
              <p className="text-zinc-500">Kunde wählen</p>
            )}
          </address>
        </div>
        <div className="text-right">
          <p className="text-[13pt] font-semibold">{v.name}</p>
          <dl className="mt-3 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-left text-[9pt]">
            <dt className="text-zinc-500">{angebot ? "Angebotsnummer" : "Rechnungsnummer"}</dt>
            <dd className="font-medium">{daten.nummer ?? "Entwurf"}</dd>
            <dt className="text-zinc-500">{angebot ? "Datum" : "Rechnungsdatum"}</dt>
            <dd>
              {daten.ausgestelltAm
                ? d(daten.ausgestelltAm)
                : angebot
                  ? "beim Versenden"
                  : "beim Stellen"}
            </dd>
            {daten.kundennummer ? (
              <>
                <dt className="text-zinc-500">Kundennummer</dt>
                <dd>{daten.kundennummer}</dd>
              </>
            ) : null}
            {angebot ? (
              angebot.gueltigBis ? (
                <>
                  <dt className="text-zinc-500">Gültig bis</dt>
                  <dd>{d(angebot.gueltigBis)}</dd>
                </>
              ) : null
            ) : (
              <>
                <dt className="text-zinc-500">Leistung</dt>
                <dd>{zeitraum}</dd>
              </>
            )}
            {e?.ustId ? (
              <>
                <dt className="text-zinc-500">Ihre USt-IdNr</dt>
                <dd>{e.ustId}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <h2 className="text-[14pt] font-semibold">
          {titel}
          {daten.nummer ? ` ${daten.nummer}` : ""}
        </h2>
        {daten.storno && daten.korrigiert ? (
          <p>Diese Korrektur hebt die Rechnung {daten.korrigiert} auf.</p>
        ) : null}
        {daten.einleitung ? <p className="whitespace-pre-line">{daten.einleitung}</p> : null}
      </div>

      <table className="w-full border-collapse text-[9.5pt]">
        <thead>
          <tr className="border-b border-zinc-400 text-left text-[8.5pt] text-zinc-500">
            <th scope="col" className="w-8 py-1.5 font-medium">
              Pos.
            </th>
            <th scope="col" className="py-1.5 font-medium">
              Leistung
            </th>
            <th scope="col" className="py-1.5 pl-3 text-right font-medium">
              Menge
            </th>
            <th scope="col" className="py-1.5 pl-3 text-right font-medium">
              Einzelpreis
            </th>
            {daten.kleinunternehmer ? null : (
              <th scope="col" className="py-1.5 pl-3 text-right font-medium">
                USt
              </th>
            )}
            <th scope="col" className="py-1.5 pl-3 text-right font-medium">
              Betrag
            </th>
          </tr>
        </thead>
        <tbody>
          {positionen.map((p, i) => (
            <tr key={i} className="border-b border-zinc-200 align-top">
              <td className="py-2 tabular-nums">{i + 1}</td>
              <td className="py-2 pr-4 whitespace-pre-line">{p.bezeichnung || "—"}</td>
              <td className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">
                {menge.format(p.menge)} {EINHEITEN[p.einheit]}
              </td>
              <td className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">
                {euro(Math.round(p.einzelpreis * 100))}
              </td>
              {daten.kleinunternehmer ? null : (
                <td className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">
                  {p.ustSatz} %
                </td>
              )}
              <td className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">
                {euro(positionNetto(p))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto grid w-full max-w-[80mm] grid-cols-[1fr_auto] gap-x-6 gap-y-1 tabular-nums">
        <dt>Summe netto</dt>
        <dd className="text-right">{euro(summen.netto)}</dd>
        {daten.kleinunternehmer
          ? null
          : summen.gruppen.map((g) => (
              <div key={g.satz} className="contents">
                <dt>
                  USt {g.satz} % auf {euro(g.netto)}
                </dt>
                <dd className="text-right">{euro(g.steuer)}</dd>
              </div>
            ))}
        <dt className="border-t border-zinc-900 pt-1 font-semibold">Gesamtbetrag</dt>
        <dd className="border-t border-zinc-900 pt-1 text-right font-semibold">
          {euro(summen.brutto)}
        </dd>
        {abzuege.map((a) => (
          <div key={a.nummer} className="contents">
            <dt>
              {a.brutto < 0 ? "verrechnet mit" : "abzüglich"} Abschlagsrechnung {a.nummer}
              {a.netto != null && a.steuer != null && !daten.kleinunternehmer ? (
                <span className="block text-[8.5pt] text-zinc-500">
                  netto {euro(Math.abs(a.netto))} zuzüglich USt {euro(Math.abs(a.steuer))}
                </span>
              ) : null}
            </dt>
            <dd className="text-right">{euro(-a.brutto)}</dd>
          </div>
        ))}
        {abzuege.length > 0 ? (
          <>
            <dt className="border-t border-zinc-900 pt-1 font-semibold">Zahlbetrag</dt>
            <dd className="border-t border-zinc-900 pt-1 text-right font-semibold">
              {euro(zahlbetrag)}
            </dd>
          </>
        ) : null}
      </dl>

      <div className="flex flex-col gap-2">
        {daten.kleinunternehmer ? <p>{KLEINUNTERNEHMER_HINWEIS}</p> : null}
        {angebot ? (
          <p>
            {angebot.gueltigBis
              ? `An dieses Angebot halten wir uns bis zum ${d(angebot.gueltigBis)} gebunden.`
              : "Wir freuen uns auf Ihre Zusage."}
          </p>
        ) : daten.storno ? (
          <p>Der Betrag wird mit der ursprünglichen Rechnung verrechnet oder erstattet.</p>
        ) : (
          <p>
            Bitte überweisen Sie {abzuege.length > 0 ? "den Zahlbetrag" : "den Gesamtbetrag"}
            {daten.faelligAm
              ? ` bis zum ${d(daten.faelligAm)}`
              : " innerhalb des Zahlungsziels"}{" "}
            ohne Abzug{v.iban ? ` auf das Konto ${ibanLesbar(v.iban)}` : ""} unter Angabe der
            Rechnungsnummer.
          </p>
        )}
        {daten.schlusstext ? <p className="whitespace-pre-line">{daten.schlusstext}</p> : null}
      </div>

      <footer className="mt-auto grid grid-cols-3 gap-6 border-t border-zinc-300 pt-3 text-[7.5pt] text-zinc-600">
        <div>
          <p className="font-medium text-zinc-800">{v.name}</p>
          {v.inhaber ? <p>Inhaber {v.inhaber}</p> : null}
          <p>{v.strasse}</p>
          <p>{[v.plz, v.ort].filter(Boolean).join(" ")}</p>
        </div>
        <div>
          {v.telefon ? <p>Telefon {v.telefon}</p> : null}
          {v.email ? <p>{v.email}</p> : null}
          {v.steuernummer ? <p>Steuernummer {v.steuernummer}</p> : null}
          {v.ustId ? <p>USt-IdNr {v.ustId}</p> : null}
        </div>
        <div>
          {v.bank ? <p>{v.bank}</p> : null}
          {v.iban ? <p>IBAN {ibanLesbar(v.iban)}</p> : null}
          {v.bic ? <p>BIC {v.bic}</p> : null}
          {v.fusszeile ? <p className="whitespace-pre-line">{v.fusszeile}</p> : null}
        </div>
      </footer>
    </article>
  );
}
