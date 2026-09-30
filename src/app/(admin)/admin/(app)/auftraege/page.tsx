import { BriefcaseIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/cms/auth/guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { listAuftraege } from "@/buero/daten/auftraege";
import { datumDe } from "@/buero/logik/ablauf";
import { centAusBetrag, euro } from "@/buero/logik/geld";
import { AUFTRAG_STATUS } from "@/buero/logik/texte";
import { CardLink, cardLinkSurface } from "../../_components/card-link";
import { AuftragStatus } from "../../_components/buero/status";
import { PageShell } from "../../_components/page-shell";

export const metadata: Metadata = { title: "Aufträge" };

const LAUFEND = ["angebot", "beauftragt", "in_arbeit", "abgenommen"] as const;

type Zeile = Awaited<ReturnType<typeof listAuftraege>>[number];

function AuftragKarte({ a, index }: { a: Zeile; index: number }) {
  return (
    <li className="rise-in" style={{ "--rise-index": index } as React.CSSProperties}>
      <Card size="sm" className={cardLinkSurface}>
        <CardHeader>
          <CardTitle className="text-base">
            <CardLink href={`/admin/auftraege/${a.id}`}>{a.titel}</CardLink>
          </CardTitle>
          <CardDescription className="truncate">{a.kundeName}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{a.nummer}</span>
          <span className="text-foreground tabular-nums">
            {a.betragNetto ? `${euro(centAusBetrag(a.betragNetto))} netto` : ""}
          </span>
        </CardContent>
        {a.leistungBis ? (
          <CardContent className="-mt-2 text-xs text-muted-foreground">
            Bis {datumDe(a.leistungBis)}
          </CardContent>
        ) : null}
      </Card>
    </li>
  );
}

// The orders as a board: one column per stage of the pipeline, finished ones below.
export default async function AuftraegePage() {
  await requireUser();
  const auftraege = await listAuftraege();
  const neu = (
    <Button asChild size="sm">
      <Link href={"/admin/auftraege/neu" as never}>
        <PlusIcon data-icon="inline-start" /> Neuer Auftrag
      </Link>
    </Button>
  );
  const fertig = auftraege.filter((a) => a.status === "abgerechnet" || a.status === "storniert");
  return (
    <PageShell
      title="Aufträge"
      lead="Vom Angebot bis zur Abrechnung. Ein Auftrag trägt seine Verträge und Rechnungen."
      actions={neu}
      wide
    >
      {auftraege.length === 0 ? (
        <Empty className="rise-in">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BriefcaseIcon />
            </EmptyMedia>
            <EmptyTitle>Noch kein Auftrag</EmptyTitle>
            <EmptyDescription>
              Ein Auftrag beginnt als Angebot und wird Schritt für Schritt weitergeführt.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{neu}</EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="@container">
            <div className="grid gap-4 @2xl:grid-cols-2 @6xl:grid-cols-4">
              {LAUFEND.map((status) => {
                const spalte = auftraege.filter((a) => a.status === status);
                return (
                  <section
                    key={status}
                    aria-labelledby={`spalte-${status}`}
                    className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3"
                  >
                    <h2
                      id={`spalte-${status}`}
                      className="flex items-center justify-between px-1 text-sm font-medium"
                    >
                      {AUFTRAG_STATUS[status].name}
                      <span className="text-muted-foreground tabular-nums">{spalte.length}</span>
                    </h2>
                    {spalte.length > 0 ? (
                      <ul role="list" className="flex flex-col gap-2">
                        {spalte.map((a, i) => (
                          <AuftragKarte key={a.id} a={a} index={i} />
                        ))}
                      </ul>
                    ) : (
                      <p className="px-1 pb-1 text-sm text-muted-foreground">Keiner.</p>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
          {fertig.length > 0 ? (
            <section aria-labelledby="fertig" className="flex flex-col gap-3">
              <h2 id="fertig" className="text-lg font-semibold">
                Abgeschlossen
              </h2>
              <div className="@container">
                <ul role="list" className="grid gap-3 @2xl:grid-cols-2 @6xl:grid-cols-4">
                  {fertig.map((a) => (
                    <li key={a.id}>
                      <Card size="sm" className={cardLinkSurface}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            <CardLink href={`/admin/auftraege/${a.id}`}>{a.titel}</CardLink>
                          </CardTitle>
                          <CardDescription className="truncate">{a.kundeName}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <AuftragStatus status={a.status} />
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </>
      )}
    </PageShell>
  );
}
