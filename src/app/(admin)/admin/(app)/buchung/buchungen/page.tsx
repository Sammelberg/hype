import { CalendarHeartIcon, DownloadIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/cms/auth/guard";
import { heute as heuteTag, tagePlus } from "@/buero/logik/ablauf";
import { euro } from "@/buero/logik/geld";
import { berlinUhrzeit } from "@/buero/logik/kalender";
import { listBuchungen } from "@/buchung/daten/buchungen";
import { berlinStart } from "@/buchung/logik/zeit";
import { QUELLE_NAMEN, STATUS_NAMEN, type BuchungStatus } from "@/buchung/logik/typen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CardLink, cardLinkSurface } from "../../../_components/card-link";
import { PageShell } from "../../../_components/page-shell";

export const metadata: Metadata = { title: "Buchungen" };

const ANSICHTEN = {
  kommend: { label: "Kommend", status: ["anfrage", "reserviert", "bestaetigt"] },
  storniert: { label: "Storniert", status: ["storniert", "abgelehnt", "verfallen"] },
  alle: { label: "Alle", status: [] },
} satisfies Record<string, { label: string; status: BuchungStatus[] }>;
type Ansicht = keyof typeof ANSICHTEN;

const tagDe = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});

const statusVariante = (s: BuchungStatus) =>
  s === "bestaetigt" ? "default" : s === "reserviert" || s === "anfrage" ? "outline" : "secondary";

export default async function BuchungenPage({
  searchParams,
}: {
  searchParams: Promise<{ ansicht?: string }>;
}) {
  await requireRole("admin");
  const roh = (await searchParams).ansicht;
  const ansicht: Ansicht = roh && roh in ANSICHTEN ? (roh as Ansicht) : "kommend";
  const jetzt = new Date();
  const heute = heuteTag(jetzt);
  const monatsAnfang = `${heute.slice(0, 7)}-01`;
  const monatsEnde = tagePlus(`${tagePlus(monatsAnfang, 40).slice(0, 7)}-01`, -1);
  const buchungen = await listBuchungen({
    ab: berlinStart(heute, "00:00")!,
    status: [...ANSICHTEN[ansicht].status],
  });
  const neu = (
    <Button asChild size="sm">
      <Link href={"/admin/buchung/buchungen/neu" as never}>
        <PlusIcon data-icon="inline-start" /> Neue Buchung
      </Link>
    </Button>
  );

  return (
    <PageShell
      title="Buchungen"
      lead="Ab heute, nach Datum. Telefon- und Instagram-Aufträge tragen Sie hier ein — sie sperren den Termin sofort auch auf der Website."
      actions={neu}
      wide
    >
      <nav aria-label="Ansicht" className="flex gap-1.5">
        {(Object.keys(ANSICHTEN) as Ansicht[]).map((a) => (
          <Link
            key={a}
            href={`/admin/buchung/buchungen?ansicht=${a}` as never}
            aria-current={a === ansicht ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3.5 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              a === ansicht && "border-primary bg-accent text-accent-foreground hover:bg-accent",
            )}
          >
            {ANSICHTEN[a].label}
          </Link>
        ))}
      </nav>

      {buchungen.length === 0 ? (
        <Empty className="rise-in">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarHeartIcon />
            </EmptyMedia>
            <EmptyTitle>Keine Buchungen</EmptyTitle>
            <EmptyDescription>Ab heute liegt in dieser Ansicht nichts an.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{neu}</EmptyContent>
        </Empty>
      ) : (
        <div className="@container">
          <ul role="list" className="grid items-start gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
            {buchungen.map((b, index) => (
              <li
                key={b.id}
                className="rise-in"
                style={{ "--rise-index": index } as React.CSSProperties}
              >
                <Card className={cardLinkSurface}>
                  <CardHeader>
                    <CardTitle className="text-lg tabular-nums">
                      <CardLink href={`/admin/buchung/buchungen/${b.id}`}>
                        {tagDe.format(b.beginn)} · {berlinUhrzeit(b.beginn)}
                      </CardLink>
                    </CardTitle>
                    <CardDescription className="truncate">
                      {[b.figur, b.paket, b.stadt].filter(Boolean).join(" · ")}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex-wrap justify-between gap-2 text-sm">
                    <span className="truncate">{b.kontaktName}</span>
                    <span className="flex items-center gap-2">
                      {b.summeCent !== null ? (
                        <span className="text-muted-foreground tabular-nums">
                          {euro(b.summeCent)}
                        </span>
                      ) : null}
                      <Badge variant={statusVariante(b.status)}>{STATUS_NAMEN[b.status]}</Badge>
                    </span>
                    <span className="w-full font-mono text-xs text-muted-foreground">
                      {b.nummer} · {QUELLE_NAMEN[b.quelle]}
                    </span>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section aria-labelledby="export-titel" className="flex flex-col gap-3 border-t pt-6">
        <h2 id="export-titel" className="text-lg font-semibold">
          Export für den Steuerberater
        </h2>
        <p className="text-sm text-muted-foreground">
          Bestätigte, abgeschlossene und stornierte Buchungen eines Zeitraums als CSV (für Excel),
          mit Summe, Anzahlung, Stornogebühr und Zahlungsart.
        </p>
        <form
          action="/admin/buchung/export"
          method="get"
          className="flex flex-wrap items-end gap-3"
        >
          <Field className="w-auto">
            <FieldLabel htmlFor="export-von">Von</FieldLabel>
            <Input id="export-von" name="von" type="date" required defaultValue={monatsAnfang} />
          </Field>
          <Field className="w-auto">
            <FieldLabel htmlFor="export-bis">Bis</FieldLabel>
            <Input id="export-bis" name="bis" type="date" required defaultValue={monatsEnde} />
          </Field>
          <Button type="submit" variant="outline">
            <DownloadIcon data-icon="inline-start" /> CSV herunterladen
          </Button>
        </form>
      </section>
    </PageShell>
  );
}
