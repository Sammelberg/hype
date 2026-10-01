import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { getMahnung } from "@/buero/daten/forderungen";
import { datumDe } from "@/buero/logik/ablauf";
import { mahnTitel } from "@/buero/logik/forderung";
import { centAusBetrag, euro } from "@/buero/logik/geld";
import { mahnText } from "@/buero/logik/texte";
import { DruckenKnopf } from "../../rechnungen/[id]/drucken";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getMahnung(Number((await params).id));
  return {
    title: {
      absolute: found ? `${mahnTitel(found.mahnung.stufe)} ${found.rechnung.nummer}` : "Mahnung",
    },
  };
}

const ibanLesbar = (iban: string) => iban.replace(/(.{4})/g, "$1 ").trim();

// A reminder as the letter that goes out, from the invoice's frozen parties and the amounts the
// Mahnung was written with.
export default async function DruckMahnungPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const found = await getMahnung(id);
  if (!found) notFound();
  const { mahnung: m, rechnung: r, zahlungen, vorigeAm } = found;
  const v = r.verkaeufer!;
  const e = r.empfaenger!;
  const gezahlt = zahlungen
    .filter((z) => z.am <= m.am)
    .reduce((s, z) => s + centAusBetrag(z.betrag), 0);
  const zeilen = [
    {
      label: `Rechnung ${r.nummer} vom ${datumDe(r.ausgestelltAm!)}`,
      cent: centAusBetrag(r.summeBrutto),
    },
    ...(gezahlt > 0 ? [{ label: "bereits gezahlt", cent: -gezahlt }] : []),
    ...(centAusBetrag(m.zinsen) > 0
      ? [
          {
            label: `Verzugszinsen ${m.zinssatz.replace(".", ",")} % p. a.${m.verzugSeit ? ` seit ${datumDe(m.verzugSeit)}` : ""} (§288 BGB)`,
            cent: centAusBetrag(m.zinsen),
          },
        ]
      : []),
    ...(centAusBetrag(m.pauschale) > 0
      ? [{ label: "Verzugspauschale (§288 Abs. 5 BGB)", cent: centAusBetrag(m.pauschale) }]
      : []),
    ...(centAusBetrag(m.gebuehr) > 0
      ? [{ label: "Mahngebühr", cent: centAusBetrag(m.gebuehr) }]
      : []),
  ];
  const absender = [v.name, v.strasse, [v.plz, v.ort].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="mx-auto flex max-w-[230mm] flex-col gap-4 px-4 py-6 print:max-w-none print:p-0">
      <div data-druck-leiste="" className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Im Druckdialog „Als PDF speichern“ wählen, um die Mahnung als PDF zu senden.
        </p>
        <DruckenKnopf />
      </div>
      <article
        aria-label={`${mahnTitel(m.stufe)} zu ${r.nummer}`}
        className="mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col gap-8 bg-white p-[12mm] text-[10pt] leading-snug text-zinc-900 shadow-sm print:shadow-none"
      >
        <header className="grid grid-cols-[minmax(0,1fr)_auto] gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-[7.5pt] text-zinc-500 underline decoration-zinc-300">{absender}</p>
            <address className="not-italic">
              {e.firma && e.firma !== e.name ? <p>{e.firma}</p> : null}
              <p>{e.name}</p>
              <p>{e.strasse}</p>
              <p>{[e.plz, e.ort].filter(Boolean).join(" ")}</p>
              {e.land !== "DE" ? <p>{e.land}</p> : null}
            </address>
          </div>
          <div className="text-right">
            <p className="text-[13pt] font-semibold">{v.name}</p>
            <p className="mt-3 text-[9pt]">
              {v.ort ? `${v.ort}, ` : ""}
              {datumDe(m.am)}
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-3">
          <h1 className="text-[14pt] font-semibold">
            {mahnTitel(m.stufe)} zur Rechnung {r.nummer}
          </h1>
          <p>Sehr geehrte Damen und Herren,</p>
          <p className="whitespace-pre-line">
            {m.text ??
              mahnText({
                stufe: m.stufe,
                nummer: r.nummer!,
                vom: datumDe(r.ausgestelltAm!),
                faellig: datumDe(r.faelligAm!),
                frist: datumDe(m.frist),
                vorige: vorigeAm ? datumDe(vorigeAm) : null,
              })}
          </p>
        </div>

        <dl className="grid w-full max-w-[130mm] grid-cols-[1fr_auto] gap-x-6 gap-y-1 tabular-nums">
          {zeilen.map((z) => (
            <div key={z.label} className="contents">
              <dt>{z.label}</dt>
              <dd className="text-right">{z.cent < 0 ? `−${euro(-z.cent)}` : euro(z.cent)}</dd>
            </div>
          ))}
          <dt className="border-t border-zinc-900 pt-1 font-semibold">
            Zu zahlen bis {datumDe(m.frist)}
          </dt>
          <dd className="border-t border-zinc-900 pt-1 text-right font-semibold">
            {euro(centAusBetrag(m.gesamt))}
          </dd>
        </dl>

        <p>
          {v.iban
            ? `Bitte überweisen Sie auf das Konto ${ibanLesbar(v.iban)}${v.bank ? ` bei der ${v.bank}` : ""} unter Angabe der Rechnungsnummer ${r.nummer}.`
            : `Bitte geben Sie bei der Zahlung die Rechnungsnummer ${r.nummer} an.`}
        </p>
        <p>
          Mit freundlichen Grüßen
          <br />
          {v.inhaber || v.name}
        </p>

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
          </div>
        </footer>
      </article>
    </main>
  );
}
