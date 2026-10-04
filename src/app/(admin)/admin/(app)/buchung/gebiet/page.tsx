import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/cms/auth/guard";
import { centAusBetrag, euro } from "@/buero/logik/geld";
import { listStaedte, listZonen } from "@/buchung/daten/stammdaten";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CardLink, cardLinkSurface } from "../../../_components/card-link";
import { PageShell } from "../../../_components/page-shell";

export const metadata: Metadata = { title: "Zonen & Orte" };

export default async function GebietPage() {
  await requireRole("admin");
  const [zonen, staedte] = await Promise.all([listZonen(), listStaedte()]);
  const ohneZone = staedte.filter((s) => !zonen.some((z) => z.code === s.zoneCode));
  return (
    <PageShell
      title="Zonen & Orte"
      lead="Der Preis richtet sich nach der Zone, nicht nach Kilometern. Die Fahrzeit hin und zurück blockiert den Darsteller zusätzlich zur Feier."
      actions={
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={"/admin/buchung/zonen/neu" as never}>
              <PlusIcon data-icon="inline-start" /> Neue Zone
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={"/admin/buchung/orte/neu" as never}>
              <PlusIcon data-icon="inline-start" /> Neuer Ort
            </Link>
          </Button>
        </div>
      }
      wide
    >
      {zonen.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Noch keine Zone. Legen Sie zuerst Zone A (Aschaffenburg und Umgebung) an, dann die Orte.
        </p>
      ) : (
        <div className="@container">
          <ul role="list" className="grid items-start gap-4 @3xl:grid-cols-2">
            {zonen.map((z) => {
              const orte = staedte.filter((s) => s.zoneCode === z.code);
              return (
                <li key={z.code}>
                  <Card className={cardLinkSurface}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        <CardLink href={`/admin/buchung/zonen/${z.code}`}>
                          Zone {z.code} · {z.name}
                        </CardLink>
                      </CardTitle>
                      <CardDescription className="tabular-nums">
                        {centAusBetrag(z.aufschlag) === 0
                          ? "Anfahrt inklusive"
                          : `Aufschlag ${euro(centAusBetrag(z.aufschlag))}`}{" "}
                        · {z.fahrtMinuten} Minuten Fahrt
                        {z.nurAnfrage ? " · nur auf Anfrage" : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {orte.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Noch kein Ort.</p>
                      ) : (
                        <ul role="list" className="relative z-10 flex flex-wrap gap-2">
                          {orte.map((o) => (
                            <li key={o.id}>
                              <Link
                                href={`/admin/buchung/orte/${o.id}` as never}
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {o.name}
                                {o.seite ? (
                                  <Badge variant="secondary" className="h-5">
                                    Seite
                                  </Badge>
                                ) : null}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {ohneZone.length > 0 ? (
        <p className="text-sm text-destructive">
          Ohne gültige Zone: {ohneZone.map((s) => s.name).join(", ")}
        </p>
      ) : null}
    </PageShell>
  );
}
