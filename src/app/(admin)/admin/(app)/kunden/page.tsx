import { ContactIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/cms/auth/guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { kundenName, listKunden } from "@/buero/daten/kunden";
import { centAusBetrag, euro } from "@/buero/logik/geld";
import { cn } from "@/lib/utils";
import { CardLink, cardLinkSurface } from "../../_components/card-link";
import { PageShell } from "../../_components/page-shell";

export const metadata: Metadata = { title: "Kunden" };

export default async function KundenPage({
  searchParams,
}: {
  searchParams: Promise<{ archiv?: string }>;
}) {
  await requireUser();
  const archiv = (await searchParams).archiv === "1";
  const kunden = await listKunden({ archiviert: archiv });
  const neu = (
    <Button asChild size="sm">
      <Link href={"/admin/kunden/neu" as never}>
        <PlusIcon data-icon="inline-start" /> Neuer Kunde
      </Link>
    </Button>
  );
  return (
    <PageShell
      title="Kunden"
      lead="Die Kundenkarte hält Kontakt, Anschrift und Rechnungsangaben, dazu alles, was mit dem Kunden läuft."
      actions={neu}
      wide
    >
      <nav aria-label="Ansicht" className="flex gap-1.5">
        {[
          { label: "Aktiv", href: "/admin/kunden", aktiv: !archiv },
          { label: "Archiv", href: "/admin/kunden?archiv=1", aktiv: archiv },
        ].map((t) => (
          <Link
            key={t.label}
            href={t.href as never}
            aria-current={t.aktiv ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3.5 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              t.aktiv && "border-primary bg-accent text-accent-foreground hover:bg-accent",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {kunden.length === 0 ? (
        <Empty className="rise-in">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ContactIcon />
            </EmptyMedia>
            <EmptyTitle>{archiv ? "Kein Kunde im Archiv" : "Noch kein Kunde"}</EmptyTitle>
            <EmptyDescription>
              {archiv
                ? "Archivierte Kunden verschwinden aus den Listen; ihre Rechnungen bleiben."
                : "Legen Sie den ersten Kunden an; Aufträge, Verträge und Rechnungen hängen an ihm."}
            </EmptyDescription>
          </EmptyHeader>
          {archiv ? null : <EmptyContent>{neu}</EmptyContent>}
        </Empty>
      ) : (
        <div className="@container">
          <ul role="list" className="grid items-start gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
            {kunden.map((k, index) => {
              const offen = centAusBetrag(k.offenBrutto);
              return (
                <li
                  key={k.id}
                  className="rise-in"
                  style={{ "--rise-index": index } as React.CSSProperties}
                >
                  <Card className={cardLinkSurface}>
                    <CardHeader>
                      <CardTitle className="truncate text-lg">
                        <CardLink href={`/admin/kunden/${k.id}`}>{kundenName(k)}</CardLink>
                      </CardTitle>
                      <CardDescription className="truncate">
                        {[k.art === "firma" && k.name ? k.name : null, k.ort]
                          .filter(Boolean)
                          .join(", ") || (k.art === "privat" ? "Privatkunde" : "Firma")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span>
                        <span className="text-muted-foreground">Laufende Aufträge </span>
                        <span className="tabular-nums">{k.auftraegeAktiv}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Offen </span>
                        <span className={cn("tabular-nums", offen > 0 && "font-medium")}>
                          {euro(offen)}
                        </span>
                      </span>
                    </CardContent>
                    <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{k.nummer}</span>
                      <span className="truncate">{k.email ?? k.telefon ?? ""}</span>
                    </CardFooter>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </PageShell>
  );
}
