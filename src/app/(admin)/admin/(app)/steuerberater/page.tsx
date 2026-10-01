import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/cms/auth/guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { journal } from "@/buero/daten/export";
import { getFirma } from "@/buero/daten/firma";
import { heute } from "@/buero/logik/ablauf";
import { letztesQuartal, ustNachMonat, zeitraum } from "@/buero/logik/export";
import { euro } from "@/buero/logik/geld";
import { PageShell } from "../../_components/page-shell";

export const metadata: Metadata = { title: "Steuerberater" };

const MONAT_KURZ = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

// What the tax adviser gets, per month, quarter or year: the invoice journal, the VAT figures of
// the return (by issue date) and a DATEV booking batch. Shown here first, downloaded as files.
export default async function SteuerberaterPage({
  searchParams,
}: {
  searchParams: Promise<{ zeitraum?: string }>;
}) {
  await requireRole("admin");
  const tag = heute();
  const q = await searchParams;
  const z = zeitraum(q.zeitraum ?? "") ?? zeitraum(letztesQuartal(tag))!;
  const jahr = Number(z.von.slice(0, 4));
  const [rechnungen, { firma }] = await Promise.all([journal(z.von, z.bis), getFirma()]);
  const monate = ustNachMonat(rechnungen);
  const summe = monate.reduce(
    (s, m) => ({
      netto19: s.netto19 + m.netto19,
      ust19: s.ust19 + m.ust19,
      netto7: s.netto7 + m.netto7,
      ust7: s.ust7 + m.ust7,
      netto0: s.netto0 + m.netto0,
      brutto: s.brutto + m.brutto,
      anzahl: s.anzahl + m.anzahl,
    }),
    { netto19: 0, ust19: 0, netto7: 0, ust7: 0, netto0: 0, brutto: 0, anzahl: 0 },
  );
  const datei = (art: string) => `/admin/steuerberater/datei/${art}?zeitraum=${z.schluessel}`;
  const wahl = (schluessel: string, label: string) => (
    <Button
      key={schluessel}
      asChild
      size="sm"
      variant={schluessel === z.schluessel ? "default" : "ghost"}
    >
      <Link
        href={`/admin/steuerberater?zeitraum=${schluessel}` as never}
        aria-current={schluessel === z.schluessel ? "page" : undefined}
      >
        {label}
      </Link>
    </Button>
  );

  return (
    <PageShell
      title="Steuerberater"
      lead={`${z.name}: ${summe.anzahl} ${summe.anzahl === 1 ? "Rechnung" : "Rechnungen"}, ${euro(summe.netto19 + summe.netto7 + summe.netto0)} netto, ${euro(summe.ust19 + summe.ust7)} Umsatzsteuer.`}
      wide
    >
      <Card className="rise-in">
        <CardHeader>
          <CardTitle>Zeitraum</CardTitle>
          <CardDescription>Nach Rechnungsdatum (Sollversteuerung).</CardDescription>
          <CardAction className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon-sm">
              <Link
                href={`/admin/steuerberater?zeitraum=${jahr - 1}` as never}
                aria-label={`Jahr ${jahr - 1}`}
              >
                <ChevronLeftIcon />
              </Link>
            </Button>
            <span className="text-sm font-medium tabular-nums">{jahr}</span>
            <Button asChild variant="ghost" size="icon-sm">
              <Link
                href={`/admin/steuerberater?zeitraum=${jahr + 1}` as never}
                aria-label={`Jahr ${jahr + 1}`}
              >
                <ChevronRightIcon />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <nav aria-label="Quartal oder Jahr" className="flex flex-wrap gap-1">
            {[1, 2, 3, 4].map((n) => wahl(`${jahr}-Q${n}`, `${n}. Quartal`))}
            {wahl(String(jahr), "Ganzes Jahr")}
          </nav>
          <nav aria-label="Monat" className="flex flex-wrap gap-1">
            {MONAT_KURZ.map((m, i) => wahl(`${jahr}-${String(i + 1).padStart(2, "0")}`, m))}
          </nav>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            art: "journal",
            titel: "Rechnungsausgangsbuch",
            text: "Jede Rechnung und jedes Storno mit Netto, USt je Satz, Brutto und Status. CSV für Excel.",
          },
          {
            art: "ust",
            titel: "Umsatzsteuer je Monat",
            text: "Die Zahlen der Voranmeldung: Umsätze und Steuer zu 19 % und 7 %, steuerfreie Umsätze.",
          },
          {
            art: "datev",
            titel: "DATEV-Buchungsstapel",
            text: firma.datev
              ? `EXTF für Kanzlei-Rechnungswesen, SKR ${firma.datev.kontenrahmen}, Berater ${firma.datev.beraternummer}.`
              : "Braucht Berater- und Mandantennummer unter Firmendaten.",
          },
        ].map((d, index) => (
          <Card
            key={d.art}
            className="rise-in"
            style={{ "--rise-index": index + 1 } as React.CSSProperties}
          >
            <CardHeader>
              <CardTitle>{d.titel}</CardTitle>
              <CardDescription>{d.text}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              {d.art === "datev" && !firma.datev ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={"/admin/firma" as never}>Firmendaten ergänzen</Link>
                </Button>
              ) : summe.anzahl === 0 ? (
                <Button variant="outline" size="sm" disabled>
                  <DownloadIcon data-icon="inline-start" /> Nichts zu laden
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <a href={datei(d.art)} download>
                    <DownloadIcon data-icon="inline-start" /> {z.name} laden
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <section
        aria-label="Umsatzsteuer je Monat"
        className="rise-in overflow-x-auto rounded-xl border bg-card"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Monat</TableHead>
              <TableHead className="text-right">Rechnungen</TableHead>
              <TableHead className="text-right">Netto 19 %</TableHead>
              <TableHead className="text-right">USt 19 %</TableHead>
              <TableHead className="text-right">Netto 7 %</TableHead>
              <TableHead className="text-right">USt 7 %</TableHead>
              <TableHead className="text-right">Steuerfrei</TableHead>
              <TableHead className="text-right">Brutto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monate.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  In diesem Zeitraum wurde keine Rechnung gestellt.
                </TableCell>
              </TableRow>
            ) : (
              monate.map((m) => (
                <TableRow key={m.monat}>
                  <TableCell>{zeitraum(m.monat)?.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.anzahl}</TableCell>
                  <TableCell className="text-right tabular-nums">{euro(m.netto19)}</TableCell>
                  <TableCell className="text-right tabular-nums">{euro(m.ust19)}</TableCell>
                  <TableCell className="text-right tabular-nums">{euro(m.netto7)}</TableCell>
                  <TableCell className="text-right tabular-nums">{euro(m.ust7)}</TableCell>
                  <TableCell className="text-right tabular-nums">{euro(m.netto0)}</TableCell>
                  <TableCell className="text-right tabular-nums">{euro(m.brutto)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {monate.length > 1 ? (
            <TableFooter>
              <TableRow className="font-medium">
                <TableCell>Summe</TableCell>
                <TableCell className="text-right tabular-nums">{summe.anzahl}</TableCell>
                <TableCell className="text-right tabular-nums">{euro(summe.netto19)}</TableCell>
                <TableCell className="text-right tabular-nums">{euro(summe.ust19)}</TableCell>
                <TableCell className="text-right tabular-nums">{euro(summe.netto7)}</TableCell>
                <TableCell className="text-right tabular-nums">{euro(summe.ust7)}</TableCell>
                <TableCell className="text-right tabular-nums">{euro(summe.netto0)}</TableCell>
                <TableCell className="text-right tabular-nums">{euro(summe.brutto)}</TableCell>
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </section>
    </PageShell>
  );
}
