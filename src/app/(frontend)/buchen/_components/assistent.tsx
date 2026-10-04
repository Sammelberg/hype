"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  ANFRAGE_TEXT,
  anfrageGrundVorab,
  angebotFuer,
  zweiFigurenNoetig,
  type BuchungsDaten,
  type Vorauswahl,
} from "@/buchung/logik/buchen";
import { preisText } from "@/buchung/logik/preis";
import { sichtbareExtras } from "@/buchung/logik/regeln";
import { BuchenSchema } from "@/buchung/logik/schemas";
import { SPRACH_NAMEN, type Sprache } from "@/buchung/logik/typen";
import { Verweis } from "@/components/site/verweis";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { buche, type BuchenErgebnis } from "../actions";
import { kalenderTage, tagText, uhrzeiten } from "../_lib/kalender";
import { EINGABE, Feld, FigurWahl, WahlKarte } from "./auswahl";
import { Kalender } from "./kalender";

// The booking form: five short steps on one page, the price always in view. Nothing is sent
// before the last step; the calendar asks the server which starts are free for exactly this
// choice. A taken slot comes back with the nearest free ones.

const SCHRITTE = ["Wer kommt?", "Wo und wann?", "Extras", "Ihre Angaben", "Prüfen und buchen"];
const WOCHEN = 6;
const MAX_SEITEN = 3;

type Angaben = {
  kontaktName: string;
  kontaktEmail: string;
  kontaktTelefon: string;
  strasse: string;
  plz: string;
  ort: string;
  kindName: string;
  kindAlter: string;
  kinderAnzahl: string;
  sprache: Sprache | "";
  notizKunde: string;
};

const LEER: Angaben = {
  kontaktName: "",
  kontaktEmail: "",
  kontaktTelefon: "",
  strasse: "",
  plz: "",
  ort: "",
  kindName: "",
  kindAlter: "",
  kinderAnzahl: "",
  sprache: "",
  notizKunde: "",
};

// Which step shows a field, so an error from the server leads back to it.
const SCHRITT_VON: Record<string, number> = {
  figurId: 0,
  zweiteFigurId: 0,
  paketId: 0,
  stadtId: 1,
  tag: 1,
  uhrzeit: 1,
  extraIds: 2,
  zahlungsart: 4,
  rechnungAn: 4,
  bedingungen: 4,
};

const zahl = (s: string) => (s.trim() === "" ? null : Number(s));

export function BuchenAssistent({
  daten,
  start,
  heute,
  startToken,
}: {
  daten: BuchungsDaten;
  start: Vorauswahl;
  /** Today as a German day („2026-11-12“), from the server. */
  heute: string;
  startToken: string;
}) {
  const [schritt, setSchritt] = useState(0);
  const [figurId, setFigurId] = useState(start.figurId);
  const [zweiteFigurId, setZweiteFigurId] = useState<number | null>(null);
  const [paketId, setPaketId] = useState(start.paketId);
  const [stadtId, setStadtId] = useState(start.stadtId);
  const [tag, setTag] = useState<string | null>(null);
  const [uhrzeit, setUhrzeit] = useState<string | null>(null);
  const [extraIds, setExtraIds] = useState<number[]>([]);
  const [kurzfristig, setKurzfristig] = useState(false);
  const [seite, setSeite] = useState(0);
  const [angaben, setAngaben] = useState<Angaben>({ ...LEER, sprache: start.sprache ?? "" });
  const [zahlungsart, setZahlungsart] = useState<"mollie" | "rechnung">(
    daten.zahlungOnline ? "mollie" : "rechnung",
  );
  const [rechnungAn, setRechnungAn] = useState("");
  const [bedingungen, setBedingungen] = useState(false);
  const [website, setWebsite] = useState("");
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [antwort, setAntwort] = useState<BuchenErgebnis | null>(null);
  const [frei, setFrei] = useState<{ schluessel: string; starts: Record<string, string[]> } | null>(
    null,
  );
  const [sendet, starteSenden] = useTransition();
  const kopf = useRef<HTMLHeadingElement>(null);
  const gewechselt = useRef(false);

  const figur = daten.figuren.find((f) => f.id === figurId) ?? null;
  const paket = daten.pakete.find((p) => p.id === paketId) ?? null;
  const stadt = daten.staedte.find((s) => s.id === stadtId) ?? null;
  const gewaehlteExtras = daten.extras.filter((x) => extraIds.includes(x.id));
  const zweiFiguren = zweiFigurenNoetig(paket, gewaehlteExtras);
  const vorab = anfrageGrundVorab({ paket, stadt, extras: gewaehlteExtras });
  const anfrage = vorab !== null || kurzfristig;
  const angebot = angebotFuer(daten, { paket, stadt, extras: gewaehlteExtras });
  const figurIds = [figurId, ...(zweiFiguren ? [zweiteFigurId] : [])].filter(
    (x): x is number => x !== null,
  );

  // The calendar's weeks and the free starts for exactly this choice.
  const tage = kalenderTage(heute, seite * WOCHEN, WOCHEN);
  const abfrage =
    !anfrage && paket && stadt && figurIds.length === (zweiFiguren ? 2 : 1)
      ? new URLSearchParams({
          figuren: figurIds.join(","),
          paket: String(paket.id),
          extras: extraIds.join(","),
          ort: String(stadt.id),
          ab: tage[0]!,
          tage: String(tage.length),
        }).toString()
      : null;
  const starts = frei && frei.schluessel === abfrage ? frei.starts : undefined;
  const laedt = abfrage !== null && starts === undefined;

  useEffect(() => {
    if (!abfrage) return;
    const abbruch = new AbortController();
    fetch(`/buchen/frei?${abfrage}`, { signal: abbruch.signal })
      .then((r) => (r.ok ? r.json() : { starts: {} }))
      .then((j: { starts: Record<string, string[]> }) =>
        setFrei({ schluessel: abfrage, starts: j.starts }),
      )
      .catch(() => {
        if (!abbruch.signal.aborted) setFrei({ schluessel: abfrage, starts: {} });
      });
    return () => abbruch.abort();
  }, [abfrage]);

  // After each step change: the step's heading takes the focus, the page starts at the top.
  useEffect(() => {
    if (!gewechselt.current) return;
    window.scrollTo({ top: 0 });
    kopf.current?.focus();
  }, [schritt]);

  // A chosen start that is no longer free (another Extra makes the Fenster longer, say).
  const zeitWeg =
    !anfrage &&
    tag !== null &&
    uhrzeit !== null &&
    starts !== undefined &&
    !starts[tag]?.includes(uhrzeit);
  const extrasSichtbar = tag
    ? sichtbareExtras(daten.extras, new Date(`${tag}T12:00:00Z`), new Date(`${heute}T12:00:00Z`))
    : daten.extras;

  function geheZu(n: number) {
    gewechselt.current = true;
    setFehler({});
    setSchritt(n);
  }

  function pruefe(n: number): Record<string, string> {
    const f: Record<string, string> = {};
    if (n === 0) {
      if (!figur) f.figurId = "Bitte wählen Sie eine Figur.";
      if (!paket) f.paketId = "Bitte wählen Sie ein Paket.";
      if (paket?.figurenAnzahl === 2 && !zweiteFigurId)
        f.zweiteFigurId = "Bitte wählen Sie die zweite Figur.";
    }
    if (n === 1) {
      if (!stadt) f.stadtId = "Bitte wählen Sie den Ort der Feier.";
      if (!tag || !uhrzeit)
        f.tag = anfrage ? "Bitte nennen Sie Tag und Uhrzeit." : "Bitte wählen Sie Tag und Uhrzeit.";
    }
    if (n === 2) {
      if (zweiFiguren && !zweiteFigurId) f.zweiteFigurId = "Bitte wählen Sie die zweite Figur.";
      if (zeitWeg) f.uhrzeit = "Mit dieser Auswahl ist die gewählte Uhrzeit nicht mehr frei.";
    }
    if (n === 3) {
      const r = BuchenSchema.safeParse(eingabe());
      for (const issue of r.error?.issues ?? []) {
        const feld = String(issue.path[0]);
        if (feld in LEER || feld === "kindAlter" || feld === "kinderAnzahl")
          f[feld] ??= issue.message;
      }
    }
    return f;
  }

  function weiter() {
    const f = pruefe(schritt);
    setFehler(f);
    if (Object.keys(f).length > 0) {
      const erstes = Object.keys(f)[0];
      document.getElementById(`feld-${erstes}`)?.focus();
      return;
    }
    geheZu(schritt + 1);
  }

  function eingabe() {
    return {
      art: anfrage ? "anfrage" : "buchung",
      figurId: figurId ?? 0,
      zweiteFigurId: zweiFiguren ? zweiteFigurId : null,
      paketId: paketId ?? 0,
      extraIds,
      stadtId: stadtId ?? 0,
      tag: tag ?? "",
      uhrzeit: uhrzeit ?? "",
      // An Anfrage pays nothing yet; a name for the invoice only says who will receive it.
      zahlungsart: anfrage ? (rechnungAn.trim() ? "rechnung" : "mollie") : zahlungsart,
      rechnungAn: anfrage || zahlungsart === "rechnung" ? rechnungAn : "",
      kontaktName: angaben.kontaktName,
      kontaktEmail: angaben.kontaktEmail,
      kontaktTelefon: angaben.kontaktTelefon,
      strasse: angaben.strasse,
      plz: angaben.plz,
      ort: angaben.ort,
      kindName: angaben.kindName,
      kindAlter: zahl(angaben.kindAlter),
      kinderAnzahl: zahl(angaben.kinderAnzahl),
      // A language from the link counts only if the chosen Figur plays in it.
      sprache:
        angaben.sprache && figur?.sprachen.includes(angaben.sprache) ? angaben.sprache : null,
      notizKunde: angaben.notizKunde,
      bedingungen,
    };
  }

  function sende() {
    const r = BuchenSchema.safeParse(eingabe());
    if (!r.success) {
      const f: Record<string, string> = {};
      for (const issue of r.error.issues) f[String(issue.path[0])] ??= issue.message;
      const ziel = SCHRITT_VON[Object.keys(f)[0]!] ?? 3;
      if (ziel !== 4) geheZu(ziel);
      setFehler(f);
      return;
    }
    setAntwort(null);
    starteSenden(async () => {
      const ergebnis = await buche({ ...r.data, website, start: startToken });
      setAntwort(ergebnis);
      if (ergebnis.status === "ungueltig") {
        setFehler(ergebnis.fehler);
        const erstes = Object.keys(ergebnis.fehler)[0]!;
        const ziel = SCHRITT_VON[erstes] ?? 3;
        if (ziel !== 4) geheZu(ziel);
      }
    });
  }

  const summe = angebot ? preisText(angebot.summeCent) : null;
  const letzter = schritt === SCHRITTE.length - 1;
  const knopf = letzter ? (anfrage ? "Anfrage senden" : "Zahlungspflichtig buchen") : "Weiter";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <div className="min-w-0">
        <nav aria-label="Schritte der Buchung">
          <p className="text-sm text-muted-foreground tabular-nums">
            Schritt {schritt + 1} von {SCHRITTE.length}
          </p>
          <ol className="mt-2 hidden gap-2 sm:flex">
            {SCHRITTE.map((s, i) => (
              <li
                key={s}
                aria-current={i === schritt ? "step" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  i === schritt && "border-foreground bg-foreground text-background",
                  i > schritt && "text-muted-foreground",
                )}
              >
                {s}
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-6 flex items-baseline justify-between gap-4">
          <h2
            ref={kopf}
            tabIndex={-1}
            className="font-hand text-3xl font-semibold text-balance outline-none sm:text-4xl"
          >
            {SCHRITTE[schritt]}
          </h2>
          {schritt > 0 ? (
            <button
              type="button"
              onClick={() => geheZu(schritt - 1)}
              className="min-h-11 shrink-0 text-base underline underline-offset-4"
            >
              Zurück
            </button>
          ) : null}
        </div>

        <div className="mt-6">
          {schritt === 0 ? (
            <div className="grid gap-8">
              <fieldset>
                <legend className="text-lg font-semibold">Figur</legend>
                <div
                  id="feld-figurId"
                  tabIndex={-1}
                  className="mt-3 grid grid-cols-2 gap-3 outline-none sm:grid-cols-3 xl:grid-cols-4"
                >
                  {daten.figuren
                    .filter((f) => f.buchbar)
                    .map((f) => (
                      <FigurWahl
                        key={f.id}
                        figur={f}
                        name="figur"
                        checked={figurId === f.id}
                        onChange={() => {
                          setFigurId(f.id);
                          if (zweiteFigurId === f.id) setZweiteFigurId(null);
                        }}
                      />
                    ))}
                </div>
                {fehler.figurId ? (
                  <p className="mt-2 text-sm font-medium text-destructive">{fehler.figurId}</p>
                ) : null}
              </fieldset>

              <fieldset>
                <legend className="text-lg font-semibold">Paket</legend>
                <div
                  id="feld-paketId"
                  tabIndex={-1}
                  className="mt-3 grid gap-3 outline-none sm:grid-cols-2"
                >
                  {daten.pakete.map((p) => (
                    <WahlKarte
                      key={p.id}
                      name="paket"
                      checked={paketId === p.id}
                      onChange={() => setPaketId(p.id)}
                      className="flex-col"
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-hand text-xl font-semibold">{p.name}</span>
                        <span className="text-lg font-semibold whitespace-nowrap tabular-nums">
                          {p.preisCent !== null && !p.nurAnfrage
                            ? preisText(p.preisCent)
                            : "Auf Anfrage"}
                        </span>
                      </span>
                      <span className="mt-1 text-sm text-muted-foreground">
                        {p.dauerMin ? `${p.dauerMin} Minuten, ` : ""}
                        {p.figurenAnzahl === 2 ? "2 Figuren" : "1 Figur"}
                      </span>
                      {p.beschreibung ? (
                        <span className="mt-2 text-base text-pretty">{p.beschreibung}</span>
                      ) : null}
                    </WahlKarte>
                  ))}
                </div>
                {fehler.paketId ? (
                  <p className="mt-2 text-sm font-medium text-destructive">{fehler.paketId}</p>
                ) : null}
              </fieldset>

              {paket?.figurenAnzahl === 2 ? (
                <ZweiteFigur
                  daten={daten}
                  ausser={figurId}
                  wert={zweiteFigurId}
                  setze={setZweiteFigurId}
                  fehler={fehler.zweiteFigurId}
                />
              ) : null}
            </div>
          ) : null}

          {schritt === 1 ? (
            <div className="grid gap-8">
              <Feld id="feld-stadtId" label="Wo feiern Sie?" fehler={fehler.stadtId}>
                <select
                  id="feld-stadtId"
                  value={stadtId ?? ""}
                  onChange={(e) => {
                    setStadtId(e.target.value ? Number(e.target.value) : null);
                    setTag(null);
                    setUhrzeit(null);
                  }}
                  aria-invalid={fehler.stadtId ? true : undefined}
                  aria-describedby={fehler.stadtId ? "feld-stadtId-fehler" : undefined}
                  className={EINGABE}
                >
                  <option value="">Bitte wählen</option>
                  {daten.staedte.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Feld>

              {stadt ? (
                anfrage ? (
                  <div className="grid gap-5">
                    <p className="rounded-2xl bg-secondary p-4 text-base text-pretty">
                      {ANFRAGE_TEXT[vorab ?? "kurzfristig"]}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Feld id="feld-tag" label="Wunschtag" fehler={fehler.tag}>
                        <input
                          id="feld-tag"
                          type="date"
                          min={heute}
                          value={tag ?? ""}
                          onChange={(e) => setTag(e.target.value || null)}
                          aria-invalid={fehler.tag ? true : undefined}
                          className={EINGABE}
                        />
                      </Feld>
                      <Feld id="feld-uhrzeit" label="Wunschbeginn">
                        <select
                          id="feld-uhrzeit"
                          value={uhrzeit ?? ""}
                          onChange={(e) => setUhrzeit(e.target.value || null)}
                          className={EINGABE}
                        >
                          <option value="">Bitte wählen</option>
                          {uhrzeiten(daten.regeln).map((z) => (
                            <option key={z} value={z}>
                              {z} Uhr
                            </option>
                          ))}
                        </select>
                      </Feld>
                    </div>
                    {kurzfristig && !vorab ? (
                      <button
                        type="button"
                        onClick={() => {
                          setKurzfristig(false);
                          setTag(null);
                          setUhrzeit(null);
                        }}
                        className="justify-self-start text-base underline underline-offset-4"
                      >
                        Zurück zum Kalender mit freien Terminen
                      </button>
                    ) : null}
                  </div>
                ) : figurIds.length < (zweiFiguren ? 2 : 1) ? (
                  <p className="text-base">Bitte wählen Sie zuerst die Figuren.</p>
                ) : (
                  <div id="feld-tag" tabIndex={-1} className="outline-none">
                    <Kalender
                      tage={tage}
                      starts={starts}
                      laedt={laedt}
                      tag={tag}
                      uhrzeit={uhrzeit}
                      onTag={(t) => {
                        setTag(t);
                        setUhrzeit(null);
                      }}
                      onUhrzeit={setUhrzeit}
                      onFrueher={seite > 0 ? () => setSeite(seite - 1) : null}
                      onSpaeter={seite < MAX_SEITEN - 1 ? () => setSeite(seite + 1) : null}
                      fehler={fehler.tag ?? fehler.uhrzeit}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setKurzfristig(true);
                        setTag(null);
                        setUhrzeit(null);
                      }}
                      className="mt-6 text-base underline underline-offset-4"
                    >
                      Früher als in {Math.round(daten.regeln.mindestVorlaufStd / 24)} Tagen oder ein
                      anderer Tag? Anfrage senden
                    </button>
                  </div>
                )
              ) : null}
            </div>
          ) : null}

          {schritt === 2 ? (
            <div className="grid gap-6">
              {extrasSichtbar.length > 0 ? (
                <fieldset>
                  <legend className="text-base text-muted-foreground">
                    Wählen Sie dazu, was Sie möchten. Was gefertigt werden muss, zeigen wir nur,
                    solange die Zeit bis zur Feier reicht.
                  </legend>
                  <div id="feld-extraIds" className="mt-4 grid gap-3 sm:grid-cols-2">
                    {extrasSichtbar.map((x) => (
                      <WahlKarte
                        key={x.id}
                        typ="checkbox"
                        name="extras"
                        checked={extraIds.includes(x.id)}
                        onChange={() =>
                          setExtraIds(
                            extraIds.includes(x.id)
                              ? extraIds.filter((e) => e !== x.id)
                              : [...extraIds, x.id],
                          )
                        }
                        className="items-start justify-between gap-4"
                      >
                        <span>
                          <span className="block font-semibold">{x.name}</span>
                          {x.beschreibung ? (
                            <span className="mt-1 block text-sm text-muted-foreground">
                              {x.beschreibung}
                            </span>
                          ) : null}
                          {x.dauerDeltaMin > 0 ? (
                            <span className="mt-1 block text-sm text-muted-foreground">
                              {x.dauerDeltaMin} Minuten länger
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 font-semibold whitespace-nowrap tabular-nums">
                          {x.preisCent !== null && !x.nurAnfrage
                            ? `+ ${preisText(x.preisCent)}`
                            : "Auf Anfrage"}
                        </span>
                      </WahlKarte>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <p className="text-base">Für diesen Termin gibt es keine Extras mehr.</p>
              )}
              {zweiFiguren && paket?.figurenAnzahl !== 2 ? (
                <ZweiteFigur
                  daten={daten}
                  ausser={figurId}
                  wert={zweiteFigurId}
                  setze={setZweiteFigurId}
                  fehler={fehler.zweiteFigurId}
                />
              ) : null}
              {zeitWeg ? (
                <div role="alert" className="rounded-2xl border border-destructive p-4">
                  <p className="text-base">
                    Mit dieser Auswahl dauert der Besuch länger, und um {uhrzeit} Uhr ist dann
                    niemand frei.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUhrzeit(null);
                      geheZu(1);
                    }}
                    className="mt-2 text-base font-medium underline underline-offset-4"
                  >
                    Andere Uhrzeit wählen
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {schritt === 3 ? (
            <AngabenFelder
              angaben={angaben}
              setze={setAngaben}
              fehler={fehler}
              sprachen={figur?.sprachen ?? []}
              website={website}
              setWebsite={setWebsite}
            />
          ) : null}

          {schritt === 4 ? (
            <div className="grid gap-8">
              <dl className="grid gap-3 rounded-2xl border p-5 text-base sm:grid-cols-2">
                <Zeile titel="Figur">
                  {[
                    figur?.name,
                    zweiFiguren ? daten.figuren.find((f) => f.id === zweiteFigurId)?.name : null,
                  ]
                    .filter(Boolean)
                    .join(" und ")}
                </Zeile>
                <Zeile titel="Paket">
                  {paket
                    ? `${paket.name}${paket.dauerMin ? `, ${paket.dauerMin} Minuten` : ""}`
                    : ""}
                </Zeile>
                <Zeile titel={anfrage ? "Wunschtermin" : "Termin"}>
                  {tag && uhrzeit ? `${tagText(tag)}, ${uhrzeit} Uhr` : ""}
                </Zeile>
                <Zeile titel="Ort">
                  {[angaben.strasse, `${angaben.plz} ${angaben.ort}`.trim()]
                    .filter(Boolean)
                    .join(", ")}
                </Zeile>
                {gewaehlteExtras.length > 0 ? (
                  <Zeile titel="Extras">{gewaehlteExtras.map((x) => x.name).join(", ")}</Zeile>
                ) : null}
                <Zeile titel="Kontakt">{`${angaben.kontaktName}, ${angaben.kontaktTelefon}`}</Zeile>
              </dl>

              {anfrage ? (
                <div className="grid gap-4">
                  <p className="text-base text-pretty">
                    Wir prüfen Ihre Anfrage und melden uns mit einem Angebot. Bezahlt wird erst,
                    wenn Sie zusagen.
                  </p>
                  <Feld
                    id="feld-rechnungAn"
                    label="Rechnung an eine Kita, Schule oder Firma? (freiwillig)"
                    fehler={fehler.rechnungAn}
                  >
                    <input
                      id="feld-rechnungAn"
                      value={rechnungAn}
                      onChange={(e) => setRechnungAn(e.target.value)}
                      className={EINGABE}
                      autoComplete="organization"
                    />
                  </Feld>
                </div>
              ) : (
                <fieldset>
                  <legend className="text-lg font-semibold">Wie zahlen Sie?</legend>
                  <div id="feld-zahlungsart" className="mt-3 grid gap-3">
                    {daten.zahlungOnline ? (
                      <WahlKarte
                        name="zahlungsart"
                        checked={zahlungsart === "mollie"}
                        onChange={() => setZahlungsart("mollie")}
                        className="flex-col"
                      >
                        <span className="font-semibold">
                          Anzahlung jetzt online
                          {angebot ? `: ${preisText(angebot.anzahlungCent)}` : ""}
                        </span>
                        <span className="mt-1 text-sm text-muted-foreground">
                          Mit der Anzahlung ist der Termin fest für Sie gebucht.
                        </span>
                      </WahlKarte>
                    ) : null}
                    <WahlKarte
                      name="zahlungsart"
                      checked={zahlungsart === "rechnung"}
                      onChange={() => setZahlungsart("rechnung")}
                      className="flex-col"
                    >
                      <span className="font-semibold">
                        Auf Rechnung, für Kitas, Schulen und Firmen
                      </span>
                      <span className="mt-1 text-sm text-muted-foreground">
                        Wir halten den Termin und schicken die Rechnung über die Anzahlung.
                      </span>
                    </WahlKarte>
                  </div>
                  {zahlungsart === "rechnung" ? (
                    <div className="mt-4">
                      <Feld
                        id="feld-rechnungAn"
                        label="Rechnung an (Kita, Schule oder Firma)"
                        fehler={fehler.rechnungAn}
                      >
                        <input
                          id="feld-rechnungAn"
                          value={rechnungAn}
                          onChange={(e) => setRechnungAn(e.target.value)}
                          autoComplete="organization"
                          aria-invalid={fehler.rechnungAn ? true : undefined}
                          aria-describedby={
                            fehler.rechnungAn ? "feld-rechnungAn-fehler" : undefined
                          }
                          className={EINGABE}
                        />
                      </Feld>
                    </div>
                  ) : null}
                </fieldset>
              )}

              <div className="rounded-2xl bg-secondary p-5 text-sm text-pretty">
                <p className="font-semibold">Wenn Sie absagen</p>
                <p className="mt-1">
                  Mehr als 14 Tage vor der Feier kostenlos. 14 bis 7 Tage vorher behalten wir die
                  Anzahlung. Ab 7 Tagen vorher die Hälfte des Preises, unter 48 Stunden den ganzen
                  Preis. Sagen wir ab, bekommen Sie alles zurück.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 text-base">
                <input
                  id="feld-bedingungen"
                  type="checkbox"
                  checked={bedingungen}
                  onChange={(e) => setBedingungen(e.target.checked)}
                  aria-invalid={fehler.bedingungen ? true : undefined}
                  aria-describedby={fehler.bedingungen ? "bedingungen-fehler" : undefined}
                  className="mt-1 size-5 shrink-0 accent-foreground"
                />
                <span>
                  Ich habe die Bedingungen für Absagen gelesen und bin einverstanden. Wie wir Ihre
                  Daten verwenden, steht in der{" "}
                  <Verweis
                    href={"/datenschutz" as never}
                    className="underline underline-offset-4"
                    target="_blank"
                  >
                    Datenschutzerklärung
                  </Verweis>
                  .
                </span>
              </label>
              {fehler.bedingungen ? (
                <p id="bedingungen-fehler" className="-mt-5 text-sm font-medium text-destructive">
                  {fehler.bedingungen}
                </p>
              ) : null}

              <Antwort
                antwort={antwort}
                onAlternative={(t, u) => {
                  setTag(t);
                  setUhrzeit(u);
                  setAntwort(null);
                }}
              />
            </div>
          ) : null}
        </div>

        {/* On a wide screen the button stands under the step; on a phone in the bar below. */}
        <div className="mt-10 hidden lg:block">
          <button
            type="button"
            onClick={letzter ? sende : weiter}
            disabled={sendet}
            className={buttonVariants({
              size: "lg",
              className: "h-auto rounded-full px-10 py-3.5 text-base font-semibold",
            })}
          >
            {sendet ? "Wird gesendet …" : knopf}
          </button>
        </div>
      </div>

      <aside aria-label="Ihre Auswahl" className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl bg-secondary p-2">
          <div className="rounded-2xl border-2 border-dashed border-foreground/20 p-5">
            <Zusammenfassung
              angebot={angebot}
              figur={figur?.name ?? null}
              paket={paket?.name ?? null}
              termin={tag && uhrzeit ? `${tagText(tag)}, ${uhrzeit} Uhr` : null}
              anfrage={anfrage}
            />
          </div>
        </div>
      </aside>

      {/* The phone's bar: the total and the one button, above the safe area. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background px-gutter pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {anfrage ? (
              "Preis nach Anfrage"
            ) : summe ? (
              <>
                Summe{" "}
                <span className="block text-xl font-semibold text-foreground tabular-nums">
                  {summe}
                </span>
              </>
            ) : (
              "Noch kein Preis"
            )}
          </p>
          <button
            type="button"
            onClick={letzter ? sende : weiter}
            disabled={sendet}
            className={buttonVariants({
              size: "lg",
              className: "h-auto min-w-36 rounded-full px-6 py-3.5 text-base font-semibold",
            })}
          >
            {sendet ? "Wird gesendet …" : knopf}
          </button>
        </div>
      </div>
    </div>
  );
}

function Zeile({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{titel}</dt>
      <dd className="mt-0.5 font-medium">{children || "—"}</dd>
    </div>
  );
}

function ZweiteFigur({
  daten,
  ausser,
  wert,
  setze,
  fehler,
}: {
  daten: BuchungsDaten;
  ausser: number | null;
  wert: number | null;
  setze: (id: number) => void;
  fehler?: string;
}) {
  return (
    <fieldset>
      <legend className="text-lg font-semibold">Zweite Figur</legend>
      <div
        id="feld-zweiteFigurId"
        tabIndex={-1}
        className="mt-3 grid grid-cols-2 gap-3 outline-none sm:grid-cols-3 xl:grid-cols-4"
      >
        {daten.figuren
          .filter((f) => f.buchbar && f.id !== ausser)
          .map((f) => (
            <FigurWahl
              key={f.id}
              figur={f}
              name="zweite-figur"
              checked={wert === f.id}
              onChange={() => setze(f.id)}
            />
          ))}
      </div>
      {fehler ? <p className="mt-2 text-sm font-medium text-destructive">{fehler}</p> : null}
    </fieldset>
  );
}

function AngabenFelder({
  angaben,
  setze,
  fehler,
  sprachen,
  website,
  setWebsite,
}: {
  angaben: Angaben;
  setze: (a: Angaben) => void;
  fehler: Record<string, string>;
  sprachen: Sprache[];
  website: string;
  setWebsite: (w: string) => void;
}) {
  const feld = (
    name: keyof Angaben,
    label: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
    hinweis?: string,
  ) => (
    <Feld id={`feld-${name}`} label={label} fehler={fehler[name]} hinweis={hinweis}>
      <input
        id={`feld-${name}`}
        value={angaben[name]}
        onChange={(e) => setze({ ...angaben, [name]: e.target.value })}
        aria-invalid={fehler[name] ? true : undefined}
        aria-describedby={
          fehler[name] ? `feld-${name}-fehler` : hinweis ? `feld-${name}-hinweis` : undefined
        }
        className={EINGABE}
        {...extra}
      />
    </Feld>
  );
  return (
    <div className="grid gap-8">
      <fieldset className="grid gap-4">
        <legend className="text-lg font-semibold">Kontakt</legend>
        {feld("kontaktName", "Ihr Name", { autoComplete: "name" })}
        <div className="grid gap-4 sm:grid-cols-2">
          {feld(
            "kontaktEmail",
            "E-Mail",
            { type: "email", autoComplete: "email", inputMode: "email" },
            "Dorthin schicken wir die Bestätigung.",
          )}
          {feld(
            "kontaktTelefon",
            "Telefon",
            { type: "tel", autoComplete: "tel", inputMode: "tel" },
            "Für den Tag der Feier.",
          )}
        </div>
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="text-lg font-semibold">Wo die Feier stattfindet</legend>
        {feld("strasse", "Straße und Hausnummer", { autoComplete: "street-address" })}
        <div className="grid grid-cols-[7rem_1fr] gap-4">
          {feld("plz", "PLZ", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 5 })}
          {feld("ort", "Ort", { autoComplete: "address-level2" })}
        </div>
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="text-lg font-semibold">Das Geburtstagskind (freiwillig)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {feld("kindName", "Vorname")}
          {feld("kindAlter", "Alter", { inputMode: "numeric" })}
          {feld("kinderAnzahl", "Wie viele Kinder?", { inputMode: "numeric" })}
        </div>
        {sprachen.length > 1 ? (
          <Feld id="feld-sprache" label="In welcher Sprache soll die Figur spielen?">
            <select
              id="feld-sprache"
              value={angaben.sprache}
              onChange={(e) => setze({ ...angaben, sprache: e.target.value as Sprache | "" })}
              className={EINGABE}
            >
              <option value="">Egal</option>
              {sprachen.map((s) => (
                <option key={s} value={s}>
                  {SPRACH_NAMEN[s]}
                </option>
              ))}
            </select>
          </Feld>
        ) : null}
        <Feld
          id="feld-notizKunde"
          label="Was sollen wir noch wissen? (freiwillig)"
          fehler={fehler.notizKunde}
        >
          <textarea
            id="feld-notizKunde"
            value={angaben.notizKunde}
            onChange={(e) => setze({ ...angaben, notizKunde: e.target.value })}
            rows={3}
            className={EINGABE}
          />
        </Feld>
      </fieldset>
      {/* For bots only: people never see or fill it. */}
      <div aria-hidden className="hidden">
        <label htmlFor="feld-website">Website</label>
        <input
          id="feld-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
    </div>
  );
}

function Zusammenfassung({
  angebot,
  figur,
  paket,
  termin,
  anfrage,
}: {
  angebot: ReturnType<typeof angebotFuer>;
  figur: string | null;
  paket: string | null;
  termin: string | null;
  anfrage: boolean;
}) {
  return (
    <div>
      <p className="font-hand text-2xl font-semibold">Ihre Feier</p>
      <dl className="mt-3 grid gap-2 text-base">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Figur</dt>
          <dd className="text-right font-medium">{figur ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Paket</dt>
          <dd className="text-right font-medium">{paket ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Termin</dt>
          <dd className="text-right font-medium">{termin ?? "—"}</dd>
        </div>
      </dl>
      <div className="-mx-5 mt-4 border-t-2 border-dashed border-foreground/20 px-5 pt-4">
        {angebot && !anfrage ? (
          <>
            <ul className="grid gap-1.5 text-base">
              {angebot.positionen.map((p) => (
                <li key={p.bezeichnung} className="flex justify-between gap-3">
                  <span>{p.bezeichnung}</span>
                  <span className="tabular-nums">
                    {p.cent === 0 ? "inklusive" : preisText(p.cent)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between gap-3 text-xl font-semibold">
              <span>Summe</span>
              <span className="tabular-nums">{preisText(angebot.summeCent)}</span>
            </p>
            <p className="mt-1 flex justify-between gap-3 text-base text-muted-foreground">
              <span>davon Anzahlung</span>
              <span className="tabular-nums">{preisText(angebot.anzahlungCent)}</span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{angebot.hinweis}</p>
          </>
        ) : (
          <p className="text-base text-muted-foreground">
            {anfrage
              ? "Den Preis nennen wir Ihnen mit dem Angebot."
              : "Der Preis erscheint, sobald Paket und Ort gewählt sind."}
          </p>
        )}
      </div>
    </div>
  );
}

function Antwort({
  antwort,
  onAlternative,
}: {
  antwort: BuchenErgebnis | null;
  onAlternative: (tag: string, uhrzeit: string) => void;
}) {
  if (!antwort || antwort.status === "ungueltig") return <div role="status" />;
  return (
    <div role="alert" className="rounded-2xl border border-destructive p-5 text-base">
      {antwort.status === "belegt" ? (
        <>
          <p className="font-semibold">Dieser Termin wurde gerade vergeben.</p>
          {antwort.alternativen.length > 0 ? (
            <>
              <p className="mt-1">
                Diese Zeiten sind noch frei. Wählen Sie eine und buchen Sie noch einmal:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {antwort.alternativen.map((a) => (
                  <button
                    key={`${a.tag}-${a.uhrzeit}`}
                    type="button"
                    onClick={() => onAlternative(a.tag, a.uhrzeit)}
                    className="min-h-11 rounded-full border bg-card px-4 text-base"
                  >
                    {tagText(a.tag)}, {a.uhrzeit} Uhr
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1">
              In der Woche davor und danach ist leider auch nichts frei. Bitte wählen Sie einen
              anderen Tag.
            </p>
          )}
        </>
      ) : antwort.status === "limit" ? (
        <p>
          Sie haben in kurzer Zeit oft gebucht. Bitte versuchen Sie es in {antwort.minuten} Minuten
          noch einmal.
        </p>
      ) : (
        <p>{antwort.meldung}</p>
      )}
    </div>
  );
}
