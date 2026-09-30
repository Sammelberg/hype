import { BuildingIcon, PlusIcon, ReceiptIcon } from "lucide-react";
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
import { listRechnungen } from "@/buero/daten/rechnungen";
import { datumDe, heute } from "@/buero/logik/ablauf";
import { centAusBetrag, euro, rechnungsSummen } from "@/buero/logik/geld";
import { CardLink, cardLinkSurface } from "../../_components/card-link";
import { RechnungStatus } from "../../_components/buero/status";
import { PageShell } from "../../_components/page-shell";

export const metadata: Metadata = { title: "Rechnungen" };

type Zeile = Awaited<ReturnType<typeof listRechnungen>>[number];

const betrag = (r: Zeile) =>
  r.summeBrutto ? centAusBetrag(r.summeBrutto) : rechnungsSummen(r.positionen, false).brutto;

export default async function RechnungenPage() {
  await requireRole("admin");
  const rechnungen = await listRechnungen();
  const tag = heute();
  const ueber = (r: Zeile) =>
    r.typ === "rechnung" && r.status === "gestellt" && Boolean(r.faelligAm && r.faelligAm < tag);
  const offen = rechnungen
    .filter((r) => r.typ === "rechnung" && r.status === "gestellt")
    .sort((a, b) => (a.faelligAm ?? "").localeCompare(b.faelligAm ?? ""));
  const gruppen = [
    { titel: "Offen", zeilen: offen },
    { titel: "Entwürfe", zeilen: rechnungen.filter((r) => r.status === "entwurf") },
    { titel: "Bezahlt", zeilen: rechnungen.filter((r) => r.status === "bezahlt") },
    {
      titel: "Storniert und Korrekturen",
      zeilen: rechnungen.filter((r) => r.status === "storniert" || r.typ === "storno"),
    },
  ];
  const offenSumme = offen.reduce((s, r) => s + betrag(r), 0);
  const ueberfaellig = offen.filter(ueber);

  const neu = (
    <Button asChild size="sm">
      <Link href={"/admin/rechnungen/neu" as never}>
        <PlusIcon data-icon="inline-start" /> Neue Rechnung
      </Link>
    </Button>
  );
  return (
    <PageShell
      title="Rechnungen"
      lead={
        offen.length > 0
          ? `${euro(offenSumme)} offen in ${offen.length} ${offen.length === 1 ? "Rechnung" : "Rechnungen"}${ueberfaellig.length > 0 ? `, ${ueberfaellig.length} davon überfällig` : ""}.`
          : "Entwürfe werden gestellt, bezahlt oder storniert. Jede gestellte Rechnung gibt es als E-Rechnung (XRechnung)."
      }
      actions={
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href={"/admin/firma" as never}>
              <BuildingIcon data-icon="inline-start" /> Firmendaten
            </Link>
          </Button>
          {neu}
        </>
      }
      wide
    >
      {rechnungen.length === 0 ? (
        <Empty className="rise-in">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptIcon />
            </EmptyMedia>
            <EmptyTitle>Noch keine Rechnung</EmptyTitle>
            <EmptyDescription>
              Eine Rechnung entsteht als Entwurf, aus einem Auftrag, einem Vertrag oder frei.
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
                  {g.zeilen.map((r, index) => (
                    <li
                      key={r.id}
                      className="rise-in"
                      style={{ "--rise-index": index } as React.CSSProperties}
                    >
                      <Card className={cardLinkSurface}>
                        <CardHeader>
                          <CardTitle className="truncate text-lg">
                            <CardLink href={`/admin/rechnungen/${r.id}`}>
                              {r.nummer ?? "Entwurf"}
                              {r.typ === "storno" ? " (Storno)" : ""}
                            </CardLink>
                          </CardTitle>
                          <CardDescription className="truncate">{r.kundeName}</CardDescription>
                          <CardAction>
                            <RechnungStatus status={r.status} ueberfaellig={ueber(r)} typ={r.typ} />
                          </CardAction>
                        </CardHeader>
                        <CardContent className="flex items-baseline justify-between gap-3">
                          <span className="text-xl font-semibold tabular-nums">
                            {euro(betrag(r))}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {r.status === "bezahlt" && r.bezahltAm
                              ? `Bezahlt am ${datumDe(r.bezahltAm)}`
                              : r.typ === "rechnung" && r.status === "gestellt" && r.faelligAm
                                ? `Fällig am ${datumDe(r.faelligAm)}`
                                : r.ausgestelltAm
                                  ? `Vom ${datumDe(r.ausgestelltAm)}`
                                  : `${r.positionen.length} ${r.positionen.length === 1 ? "Position" : "Positionen"}`}
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
