import { type DokumentDaten, rechnungsBlatt } from "@/buero/logik/blatt";
import { cn } from "@/lib/utils";

export type { DokumentDaten } from "@/buero/logik/blatt";

// The invoice as a sheet of paper (DIN 5008 order): the same component shows a draft live beside
// its form and prints an issued invoice — and, with `angebot`, an offer. What it says comes from
// rechnungsBlatt (buero/logik/blatt.ts), which the PDF reads as well; this only lays it out.
export function RechnungsDokument({
  daten,
  className,
}: {
  daten: DokumentDaten;
  className?: string;
}) {
  const blatt = rechnungsBlatt(daten);

  return (
    <article
      aria-label={blatt.name}
      data-rechnungsblatt=""
      className={cn(
        "mx-auto flex w-full max-w-[210mm] flex-col gap-8 bg-white p-[12mm] text-[10pt] leading-snug text-zinc-900 shadow-sm",
        className,
      )}
    >
      <header className="grid grid-cols-[minmax(0,1fr)_auto] gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-[7.5pt] text-zinc-500 underline decoration-zinc-300">
            {blatt.absenderZeile}
          </p>
          <address className="not-italic">
            {blatt.adresse ? (
              blatt.adresse.map((zeile, i) => <p key={i}>{zeile}</p>)
            ) : (
              <p className="text-zinc-500">Kunde wählen</p>
            )}
          </address>
        </div>
        <div className="text-right">
          <p className="text-[13pt] font-semibold">{daten.verkaeufer.name}</p>
          <dl className="mt-3 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-left text-[9pt]">
            {blatt.meta.map((zeile, i) => (
              <div key={zeile.label} className="contents">
                <dt className="text-zinc-500">{zeile.label}</dt>
                <dd className={i === 0 ? "font-medium" : undefined}>{zeile.wert}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <h2 className="text-[14pt] font-semibold">{blatt.ueberschrift}</h2>
        {blatt.korrektur ? <p>{blatt.korrektur}</p> : null}
        {blatt.einleitung ? <p className="whitespace-pre-line">{blatt.einleitung}</p> : null}
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
            {blatt.mitUst ? (
              <th scope="col" className="py-1.5 pl-3 text-right font-medium">
                USt
              </th>
            ) : null}
            <th scope="col" className="py-1.5 pl-3 text-right font-medium">
              Betrag
            </th>
          </tr>
        </thead>
        <tbody>
          {blatt.posten.map((p) => (
            <tr key={p.pos} className="border-b border-zinc-200 align-top">
              <td className="py-2 tabular-nums">{p.pos}</td>
              <td className="py-2 pr-4 whitespace-pre-line">{p.bezeichnung}</td>
              <td className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">{p.menge}</td>
              <td className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">
                {p.einzelpreis}
              </td>
              {blatt.mitUst ? (
                <td className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">{p.ust}</td>
              ) : null}
              <td className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">{p.betrag}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto grid w-full max-w-[80mm] grid-cols-[1fr_auto] gap-x-6 gap-y-1 tabular-nums">
        {blatt.summen.map((s) => (
          <div key={s.label} className="contents">
            <dt className={s.stark ? "border-t border-zinc-900 pt-1 font-semibold" : undefined}>
              {s.label}
              {s.zusatz ? (
                <span className="block text-[8.5pt] text-zinc-500">{s.zusatz}</span>
              ) : null}
            </dt>
            <dd
              className={cn(
                "text-right",
                s.stark ? "border-t border-zinc-900 pt-1 font-semibold" : null,
              )}
            >
              {s.wert}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2">
        {blatt.hinweise.map((text) => (
          <p key={text}>{text}</p>
        ))}
        {blatt.schlusstext ? <p className="whitespace-pre-line">{blatt.schlusstext}</p> : null}
      </div>

      <footer className="mt-auto grid grid-cols-3 gap-6 border-t border-zinc-300 pt-3 text-[7.5pt] text-zinc-600">
        {blatt.fuss.map((spalte, i) => (
          <div key={i}>
            {spalte.map((zeile, j) => (
              <p
                key={j}
                className={cn(
                  "whitespace-pre-line",
                  i === 0 && j === 0 ? "font-medium text-zinc-800" : null,
                )}
              >
                {zeile}
              </p>
            ))}
          </div>
        ))}
      </footer>
    </article>
  );
}
