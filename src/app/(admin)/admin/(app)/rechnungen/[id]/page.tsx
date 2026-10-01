import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAuftraegeAuswahl } from "@/buero/daten/auftraege";
import { getFirma } from "@/buero/daten/firma";
import { listKundenAuswahl } from "@/buero/daten/kunden";
import { ausgabeDaten, getRechnung } from "@/buero/daten/rechnungen";
import { listVertraegeAuswahl } from "@/buero/daten/vertraege";
import { datumDe, heute } from "@/buero/logik/ablauf";
import { pruefeRechnung } from "@/buero/logik/pflichtangaben";
import { RechnungsDokument } from "../../../_components/buero/rechnungs-dokument";
import { RechnungStatus } from "../../../_components/buero/status";
import { EditorShell } from "../../../_components/editor-shell";
import { RechnungAktionen } from "../_components/rechnung-aktionen";
import { RechnungEditor } from "../_components/rechnung-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getRechnung(Number((await params).id));
  return { title: found?.rechnung.nummer ?? "Rechnungsentwurf" };
}

export default async function RechnungPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const found = await getRechnung(id);
  if (!found) notFound();
  const r = found.rechnung;

  // A draft is edited; an issued invoice is shown as it was issued.
  if (r.status === "entwurf") {
    const [{ firma }, kunden, auftraege, vertraege] = await Promise.all([
      getFirma(),
      listKundenAuswahl(r.kundeId),
      listAuftraegeAuswahl(),
      listVertraegeAuswahl(),
    ]);
    return (
      <RechnungEditor
        key={r.updatedAt.getTime()}
        id={r.id}
        firma={firma}
        kunden={kunden}
        auftraege={auftraege}
        vertraege={vertraege}
        rechnung={{
          art: r.art,
          kundeId: r.kundeId,
          auftragId: r.auftragId,
          vertragId: r.vertragId,
          leistungVon: r.leistungVon,
          leistungBis: r.leistungBis,
          zahlungszielTage: r.zahlungszielTage,
          einleitung: r.einleitung,
          schlusstext: r.schlusstext,
          positionen: r.positionen,
        }}
      />
    );
  }

  const daten = ausgabeDaten(r, found.korrigiert?.nummer ?? null);
  const { xrechnung } = pruefeRechnung({
    firma: daten.verkaeufer,
    empfaenger: daten.empfaenger,
    positionen: daten.positionen,
    leistungVon: daten.leistungVon,
    leistungBis: daten.leistungBis,
  });
  const tag = heute();
  const ueberfaellig =
    r.typ === "rechnung" && r.status === "gestellt" && Boolean(r.faelligAm && r.faelligAm < tag);
  const zeilen = [
    {
      label: "Kunde",
      wert: (
        <Link href={`/admin/kunden/${r.kundeId}` as never} className="underline underline-offset-2">
          {daten.empfaenger.name}
        </Link>
      ),
    },
    { label: "Gestellt am", wert: datumDe(daten.ausgestelltAm) },
    ...(r.typ === "rechnung" ? [{ label: "Fällig am", wert: datumDe(daten.faelligAm) }] : []),
    ...(r.bezahltAm ? [{ label: "Bezahlt am", wert: datumDe(r.bezahltAm) }] : []),
    ...(found.auftrag
      ? [
          {
            label: "Auftrag",
            wert: (
              <Link
                href={`/admin/auftraege/${found.auftrag.id}` as never}
                className="underline underline-offset-2"
              >
                {found.auftrag.titel}
              </Link>
            ),
          },
        ]
      : []),
    ...(found.vertrag
      ? [
          {
            label: "Vertrag",
            wert: (
              <Link
                href={`/admin/vertraege/${found.vertrag.id}` as never}
                className="underline underline-offset-2"
              >
                {found.vertrag.titel}
              </Link>
            ),
          },
        ]
      : []),
    ...(found.korrigiert
      ? [
          {
            label: "Korrigiert",
            wert: (
              <Link
                href={`/admin/rechnungen/${found.korrigiert.id}` as never}
                className="underline underline-offset-2"
              >
                {found.korrigiert.nummer}
              </Link>
            ),
          },
        ]
      : []),
    ...(found.storno
      ? [
          {
            label: "Storno",
            wert: (
              <Link
                href={`/admin/rechnungen/${found.storno.id}` as never}
                className="underline underline-offset-2"
              >
                {found.storno.nummer}
              </Link>
            ),
          },
        ]
      : []),
  ];

  return (
    <EditorShell
      backHref="/admin/rechnungen"
      backLabel="Rechnungen"
      title={`${r.typ === "storno" ? "Storno" : "Rechnung"} ${daten.nummer}`}
      actions={
        <RechnungAktionen
          id={r.id}
          nummer={daten.nummer}
          status={r.status as "gestellt" | "bezahlt" | "storniert"}
          typ={r.typ}
          xrechnungMoeglich={xrechnung.length === 0}
          heute={tag}
        />
      }
      asideAlways
      aside={
        <div className="flex flex-col gap-6 xl:sticky xl:top-24">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Stand <RechnungStatus status={r.status} ueberfaellig={ueberfaellig} typ={r.typ} />
              </CardTitle>
              <CardDescription>
                Festgeschrieben: diese Rechnung ändert sich nicht mehr. Korrekturen laufen über ein
                Storno.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {zeilen.map((z) => (
                  <div key={z.label} className="contents">
                    <dt className="text-muted-foreground">{z.label}</dt>
                    <dd className="min-w-0 truncate">{z.wert}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>E-Rechnung</CardTitle>
              <CardDescription>
                {xrechnung.length === 0
                  ? "Als XRechnung 3.0 (UBL) zum Versand per E-Mail oder zur Übergabe an das Portal einer Behörde."
                  : "Für die XRechnung fehlten beim Stellen Angaben; die Rechnung lässt sich drucken und als PDF senden."}
              </CardDescription>
            </CardHeader>
            {xrechnung.length > 0 ? (
              <CardContent className="text-sm">
                <ul className="flex flex-col gap-1">
                  {xrechnung.map((m) => (
                    <li key={m.text}>
                      {m.text} <span className="text-muted-foreground">({m.norm})</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            ) : null}
          </Card>
        </div>
      }
    >
      <div className="rounded-xl border bg-muted/50 p-3">
        <RechnungsDokument
          daten={{
            ...daten,
            storno: r.typ === "storno",
            korrigiert: found.korrigiert?.nummer ?? null,
            kundennummer: found.kunde.nummer,
            einleitung: r.einleitung,
            schlusstext: r.schlusstext,
          }}
        />
      </div>
    </EditorShell>
  );
}
