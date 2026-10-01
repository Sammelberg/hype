import { FileTextIcon, PlusIcon } from "lucide-react";
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getFirma } from "@/buero/daten/firma";
import { listAngebote } from "@/buero/daten/angebote";
import { datumDe, heute } from "@/buero/logik/ablauf";
import { euro, rechnungsSummen } from "@/buero/logik/geld";
import { CardLink, cardLinkSurface } from "../../_components/card-link";
import { AngebotStatus } from "../../_components/buero/status";
import { PageShell } from "../../_components/page-shell";

export const metadata: Metadata = { title: "Angebote" };

export default async function AngebotePage() {
  await requireRole("admin");
  const [angebote, { firma }] = await Promise.all([listAngebote(), getFirma()]);
  const tag = heute();
  const abgelaufen = (a: (typeof angebote)[number]) =>
    a.status === "versendet" && Boolean(a.gueltigBis && a.gueltigBis < tag);
  const offen = angebote.filter((a) => a.status === "versendet");
  const gruppen = [
    { titel: "Beim Kunden", zeilen: offen },
    { titel: "Entwürfe", zeilen: angebote.filter((a) => a.status === "entwurf") },
    { titel: "Angenommen", zeilen: angebote.filter((a) => a.status === "angenommen") },
    { titel: "Abgelehnt", zeilen: angebote.filter((a) => a.status === "abgelehnt") },
  ];
  const summe = (a: (typeof angebote)[number]) =>
    rechnungsSummen(a.positionen, firma.kleinunternehmer).netto;
  const offenSumme = offen.reduce((s, a) => s + summe(a), 0);

  const neu = (
    <Button asChild size="sm">
      <Link href={"/admin/angebote/neu" as never}>
        <PlusIcon data-icon="inline-start" /> Neues Angebot
      </Link>
    </Button>
  );
  return (
    <PageShell
      title="Angebote"
      lead={
        offen.length > 0
          ? `${offen.length} beim Kunden über ${euro(offenSumme)} netto.`
          : "Ein Angebot bekommt seine Nummer beim Versenden; die Zusage macht daraus den Auftrag."
      }
      actions={neu}
      wide
    >
      {angebote.length === 0 ? (
        <Empty className="rise-in">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>Noch kein Angebot</EmptyTitle>
            <EmptyDescription>
              Schreiben Sie es frei oder aus einem Auftrag, der noch beim Angebot steht.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{neu}</EmptyContent>
        </Empty>
      ) : (
        gruppen
          .filter((g) => g.zeilen.length > 0)
          .map((g) => (
            <section key={g.titel} aria-label={g.titel} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{g.titel}</h2>
              <div className="@container">
                <ul
                  role="list"
                  className="grid items-start gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3"
                >
                  {g.zeilen.map((a, index) => (
                    <li
                      key={a.id}
                      className="rise-in"
                      style={{ "--rise-index": index } as React.CSSProperties}
                    >
                      <Card className={cardLinkSurface}>
                        <CardHeader>
                          <CardTitle className="truncate text-lg">
                            <CardLink href={`/admin/angebote/${a.id}`}>{a.titel}</CardLink>
                          </CardTitle>
                          <CardDescription className="truncate">
                            {a.kundeName}
                            {a.nummer ? ` · ${a.nummer}` : ""}
                          </CardDescription>
                          <CardAction>
                            <AngebotStatus status={a.status} abgelaufen={abgelaufen(a)} />
                          </CardAction>
                        </CardHeader>
                        <CardContent className="flex items-baseline justify-between gap-3">
                          <span className="text-xl font-semibold tabular-nums">
                            {euro(summe(a))}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {a.status === "versendet" && a.gueltigBis
                              ? `Gültig bis ${datumDe(a.gueltigBis)}`
                              : a.entschiedenAm
                                ? `Am ${datumDe(a.entschiedenAm)}`
                                : "netto"}
                          </span>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))
      )}
    </PageShell>
  );
}
