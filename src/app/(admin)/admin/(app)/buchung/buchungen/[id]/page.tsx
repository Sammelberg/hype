import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { requireRole } from "@/cms/auth/guard";
import { euro } from "@/buero/logik/geld";
import { berlinUhrzeit } from "@/buero/logik/kalender";
import { getBuchung } from "@/buchung/daten/buchungen";
import { zahlungenVon } from "@/buchung/daten/zahlungen";
import { mailsZu } from "@/cms/mail/log";
import { EMAIL_KINDS } from "@/cms/mail/types";
import { QUELLE_NAMEN, SPRACH_NAMEN, STATUS_NAMEN, ZAHLUNG_NAMEN } from "@/buchung/logik/typen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "../../../../_components/page-shell";
import { NotizEditor } from "../_components/notiz-editor";
import { StatusAktionen } from "../_components/status-aktionen";

type Props = { params: Promise<{ id: string }> };

const kurzDatum = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

const ZAHLUNG_ART_NAMEN = {
  anzahlung: "Anzahlung",
  rest: "Restzahlung",
  erstattung: "Erstattung",
} as const;
const ZAHLUNG_STATUS_NAMEN = {
  offen: "offen",
  bezahlt: "bezahlt",
  fehlgeschlagen: "fehlgeschlagen",
  abgebrochen: "abgebrochen",
  erstattet: "erstattet",
} as const;

const datum = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Berlin",
});
const zeitpunkt = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id);
  const b = Number.isInteger(id) ? await getBuchung(id) : null;
  return { title: b?.nummer ?? "Buchung" };
}

function Zeilen({ eintraege }: { eintraege: [string, ReactNode][] }) {
  const sichtbar = eintraege.filter(
    ([, wert]) => wert !== null && wert !== undefined && wert !== "",
  );
  return (
    <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-6 gap-y-2 text-sm">
      {sichtbar.map(([name, wert]) => (
        <div key={name} className="contents">
          <dt className="text-muted-foreground">{name}</dt>
          <dd className="min-w-0 break-words">{wert}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function BuchungPage({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const b = await getBuchung(id);
  if (!b) notFound();
  const [zahlungen, mails] = await Promise.all([
    zahlungenVon(b.id),
    mailsZu({ type: "buchung", id: b.id }),
  ]);

  return (
    <PageShell
      title={`${b.nummer} · ${b.kontaktName}`}
      lead={`${datum.format(b.beginn)}, ${berlinUhrzeit(b.beginn)} Uhr`}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href={"/admin/buchung/buchungen" as never}>
            <ArrowLeftIcon data-icon="inline-start" /> Buchungen
          </Link>
        </Button>
      }
      wide
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge>{STATUS_NAMEN[b.status]}</Badge>
        <span className="text-sm text-muted-foreground">
          über {QUELLE_NAMEN[b.quelle]}
          {b.status === "reserviert" && b.haltenBis
            ? ` · reserviert bis ${zeitpunkt.format(b.haltenBis)}`
            : ""}
          {b.storniertAm ? ` · storniert am ${zeitpunkt.format(b.storniertAm)}` : ""}
        </span>
        {b.summeCent !== null ? (
          <StatusAktionen
            id={b.id}
            status={b.status}
            beginn={b.beginn.toISOString()}
            summeCent={b.summeCent}
            anzahlungCent={b.anzahlungCent ?? 0}
          />
        ) : null}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feier</CardTitle>
          </CardHeader>
          <CardContent>
            <Zeilen
              eintraege={[
                ["Figur", [b.figur, b.zweiteFigur].filter(Boolean).join(" und ")],
                ["Paket", b.paket],
                ["Extras", b.extras.join(", ")],
                ["Ort", b.stadt ? `${b.stadt} (Zone ${b.zoneCode})` : b.ortFreitext],
                [
                  "Adresse",
                  [b.strasse, [b.plz, b.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "),
                ],
                [
                  "Kind",
                  [b.kindName, b.kindAlter !== null ? `${b.kindAlter} Jahre` : null]
                    .filter(Boolean)
                    .join(", "),
                ],
                ["Kinder", b.kinderAnzahl],
                ["Sprache", b.sprache ? SPRACH_NAMEN[b.sprache] : null],
                ["Wunsch der Kundin", b.notizKunde],
                ["Rechnung an", b.rechnungAn],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontakt</CardTitle>
          </CardHeader>
          <CardContent>
            <Zeilen
              eintraege={[
                ["Name", b.kontaktName],
                [
                  "E-Mail",
                  <a key="m" href={`mailto:${b.kontaktEmail}`} className="underline">
                    {b.kontaktEmail}
                  </a>,
                ],
                [
                  "Telefon",
                  b.kontaktTelefon ? (
                    <a key="t" href={`tel:${b.kontaktTelefon}`} className="underline">
                      {b.kontaktTelefon}
                    </a>
                  ) : null,
                ],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preis</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm">
              {b.positionen.map((p, i) => (
                <div key={i} className="contents">
                  <dt>{p.bezeichnung}</dt>
                  <dd className="text-right tabular-nums">
                    {p.cent === 0 && p.art === "zone" ? "inklusive" : euro(p.cent)}
                  </dd>
                </div>
              ))}
              {b.summeCent !== null ? (
                <div className="contents font-medium">
                  <dt className="border-t pt-1.5">Summe</dt>
                  <dd className="border-t pt-1.5 text-right tabular-nums">{euro(b.summeCent)}</dd>
                </div>
              ) : null}
            </dl>
            <Zeilen
              eintraege={[
                ["Anzahlung", b.anzahlungCent !== null ? euro(b.anzahlungCent) : null],
                ["Zahlungsart", b.zahlungsart ? ZAHLUNG_NAMEN[b.zahlungsart] : null],
                ["Stornogebühr", b.stornoGebuehrCent !== null ? euro(b.stornoGebuehrCent) : null],
                ["Stornogrund", b.stornoGrund],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zahlungen und E-Mails</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {zahlungen.length === 0 ? (
              <p className="text-muted-foreground">Noch keine Zahlung.</p>
            ) : (
              <ul role="list" className="flex flex-col gap-1.5">
                {zahlungen.map((z) => (
                  <li key={z.id} className="flex flex-wrap justify-between gap-x-4">
                    <span>
                      {ZAHLUNG_ART_NAMEN[z.art]} über {ZAHLUNG_NAMEN[z.adapter]}:{" "}
                      {ZAHLUNG_STATUS_NAMEN[z.status]}
                    </span>
                    <span className="tabular-nums">
                      {z.art === "erstattung" ? "− " : ""}
                      {euro(z.betragCent)}, {kurzDatum.format(z.createdAt)}{" "}
                      {berlinUhrzeit(z.createdAt)} Uhr
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {mails.length === 0 ? (
              <p className="text-muted-foreground">Noch keine E-Mail zu dieser Buchung.</p>
            ) : (
              <ul role="list" className="flex flex-col gap-1.5">
                {mails.map((m) => (
                  <li key={m.id} className="flex flex-wrap justify-between gap-x-4">
                    <span>{EMAIL_KINDS[m.kind] ?? m.kind}</span>
                    <span className="text-muted-foreground">an {m.to}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Darsteller</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {b.einsaetze.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch niemand eingeteilt.</p>
            ) : (
              <ul role="list" className="flex flex-col gap-2 text-sm">
                {b.einsaetze.map((e) => (
                  <li key={e.darstellerId} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">{e.darsteller}</span>
                    {e.telefon ? (
                      <a href={`tel:${e.telefon}`} className="underline">
                        {e.telefon}
                      </a>
                    ) : null}
                    <span className="text-muted-foreground tabular-nums">
                      unterwegs {berlinUhrzeit(e.von)}–{berlinUhrzeit(e.bis)}
                    </span>
                    {e.aktiv ? null : <Badge variant="secondary">frei gegeben</Badge>}
                  </li>
                ))}
              </ul>
            )}
            <NotizEditor id={b.id} notiz={b.notizIntern} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
