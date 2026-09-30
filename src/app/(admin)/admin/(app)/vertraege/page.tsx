import { FileSignatureIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

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
import { listVertraege, vertragsende } from "@/buero/daten/vertraege";
import { datumDe, heute, tagePlus } from "@/buero/logik/ablauf";
import { centAusBetrag, euro } from "@/buero/logik/geld";
import { INTERVALLE, VERTRAGSARTEN } from "@/buero/logik/typen";
import { CardLink, cardLinkSurface } from "../../_components/card-link";
import { VertragStatus } from "../../_components/buero/status";
import { PageShell } from "../../_components/page-shell";

export const metadata: Metadata = { title: "Verträge" };

type Zeile = Awaited<ReturnType<typeof listVertraege>>[number];

export default async function VertraegePage() {
  const vertraege = await listVertraege();
  const tag = heute();
  const bald = tagePlus(tag, 60);
  const neu = (
    <Button asChild size="sm">
      <Link href={"/admin/vertraege/neu" as never}>
        <PlusIcon data-icon="inline-start" /> Neuer Vertrag
      </Link>
    </Button>
  );
  const aktiv = vertraege
    .filter((v) => v.status === "aktiv")
    .map((v) => ({ v, ende: vertragsende(v, tag) }))
    .sort((a, b) => (a.ende?.kuendigenBis ?? "9").localeCompare(b.ende?.kuendigenBis ?? "9"));
  const gruppen: {
    titel: string;
    zeilen: { v: Zeile; ende: ReturnType<typeof vertragsende> }[];
  }[] = [
    { titel: "Aktiv", zeilen: aktiv },
    {
      titel: "Entwürfe",
      zeilen: vertraege.filter((v) => v.status === "entwurf").map((v) => ({ v, ende: null })),
    },
    {
      titel: "Gekündigt und beendet",
      zeilen: vertraege
        .filter((v) => v.status === "gekuendigt" || v.status === "beendet")
        .map((v) => ({ v, ende: null })),
    },
  ];

  return (
    <PageShell
      title="Verträge"
      lead="Was mit wem vereinbart ist, wie lange es läuft und bis wann es sich kündigen lässt."
      actions={neu}
      wide
    >
      {vertraege.length === 0 ? (
        <Empty className="rise-in">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSignatureIcon />
            </EmptyMedia>
            <EmptyTitle>Noch kein Vertrag</EmptyTitle>
            <EmptyDescription>
              Wartung, Lizenz, Auftragsverarbeitung: jeder Vertrag hält Laufzeit, Kündigungsfrist
              und Vergütung.
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
                  {g.zeilen.map(({ v, ende }, index) => {
                    const frist = ende?.kuendigenBis && ende.kuendigenBis <= bald;
                    return (
                      <li
                        key={v.id}
                        className="rise-in"
                        style={{ "--rise-index": index } as React.CSSProperties}
                      >
                        <Card className={cardLinkSurface}>
                          <CardHeader>
                            <CardTitle className="truncate text-lg">
                              <CardLink href={`/admin/vertraege/${v.id}`}>{v.titel}</CardLink>
                            </CardTitle>
                            <CardDescription className="truncate">
                              {v.kundeName}, {VERTRAGSARTEN[v.art]}
                            </CardDescription>
                            <CardAction>
                              <VertragStatus status={v.status} />
                            </CardAction>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-1 text-sm">
                            {ende ? (
                              <p className={frist ? "text-warning font-medium" : undefined}>
                                {ende.kuendigenBis
                                  ? `Kündbar bis ${datumDe(ende.kuendigenBis)} zum ${datumDe(ende.ende)}`
                                  : `Endet am ${datumDe(ende.ende)}`}
                              </p>
                            ) : v.endetAm ? (
                              <p>Endet am {datumDe(v.endetAm)}</p>
                            ) : (
                              <p className="text-muted-foreground">Beginn {datumDe(v.beginn)}</p>
                            )}
                            {v.verguetungNetto ? (
                              <p className="text-muted-foreground">
                                {euro(centAusBetrag(v.verguetungNetto))} netto
                                {v.verguetungIntervall
                                  ? `, ${INTERVALLE[v.verguetungIntervall]}`
                                  : ""}
                              </p>
                            ) : null}
                          </CardContent>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ))
      )}
    </PageShell>
  );
}
