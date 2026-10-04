import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { requireRole } from "@/cms/auth/guard";
import { centAusBetrag, euro } from "@/buero/logik/geld";
import { listExtras, listPakete } from "@/buchung/daten/stammdaten";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CardLink, cardLinkSurface } from "../../../_components/card-link";
import { PageShell } from "../../../_components/page-shell";

export const metadata: Metadata = { title: "Pakete & Extras" };

const preis = (p: string | null) => (p === null ? "auf Anfrage" : euro(centAusBetrag(p)));

function Abschnitt({
  titel,
  text,
  neuHref,
  neuLabel,
  leer,
  children,
}: {
  titel: string;
  text: string;
  neuHref: string;
  neuLabel: string;
  leer: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`titel-${neuHref}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={`titel-${neuHref}`} className="text-xl font-semibold">
            {titel}
          </h2>
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={neuHref as never}>
            <PlusIcon data-icon="inline-start" /> {neuLabel}
          </Link>
        </Button>
      </div>
      {leer ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Noch nichts angelegt.
        </p>
      ) : (
        <div className="@container">
          <ul role="list" className="grid items-start gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
            {children}
          </ul>
        </div>
      )}
    </section>
  );
}

export default async function AngebotPage() {
  await requireRole("admin");
  const [pakete, extras] = await Promise.all([listPakete(), listExtras()]);
  return (
    <PageShell
      title="Pakete & Extras"
      lead="Pakete sagen, wie lange und mit was; die Figur wählen die Eltern getrennt. Preise sind Endpreise in Zone A."
      wide
    >
      <Abschnitt
        titel="Pakete"
        text="Mini, Klassik, Premium — und was nur auf Anfrage geht."
        neuHref="/admin/buchung/pakete/neu"
        neuLabel="Neues Paket"
        leer={pakete.length === 0}
      >
        {pakete.map((p) => (
          <li key={p.id}>
            <Card className={cardLinkSurface}>
              <CardHeader>
                <CardTitle className="truncate text-lg">
                  <CardLink href={`/admin/buchung/pakete/${p.id}`}>{p.name}</CardLink>
                </CardTitle>
                <CardDescription className="tabular-nums">
                  {p.dauerMin ? `${p.dauerMin} Minuten · ` : ""}
                  {preis(p.preis)}
                  {p.figurenAnzahl === 2 ? " · zwei Figuren" : ""}
                </CardDescription>
              </CardHeader>
              {p.nurAnfrage || !p.aktiv ? (
                <CardFooter className="gap-2">
                  {p.nurAnfrage ? <Badge variant="outline">Nur auf Anfrage</Badge> : null}
                  {p.aktiv ? null : <Badge variant="secondary">Deaktiviert</Badge>}
                </CardFooter>
              ) : null}
            </Card>
          </li>
        ))}
      </Abschnitt>

      <Abschnitt
        titel="Extras"
        text="Was dazukommt. Vorlauf und Verlängerung wirken auf Angebot und Planung."
        neuHref="/admin/buchung/extras/neu"
        neuLabel="Neues Extra"
        leer={extras.length === 0}
      >
        {extras.map((x) => (
          <li key={x.id}>
            <Card className={cardLinkSurface}>
              <CardHeader>
                <CardTitle className="truncate text-lg">
                  <CardLink href={`/admin/buchung/extras/${x.id}`}>{x.name}</CardLink>
                </CardTitle>
                <CardDescription className="tabular-nums">
                  {preis(x.preis)}
                  {x.dauerDeltaMin ? ` · +${x.dauerDeltaMin} Minuten` : ""}
                  {x.vorlaufTage ? ` · ${x.vorlaufTage} Tage Vorlauf` : ""}
                </CardDescription>
              </CardHeader>
              {x.nurAnfrage || x.zusatzFigur || !x.aktiv ? (
                <CardFooter className="gap-2">
                  {x.zusatzFigur ? <Badge variant="outline">Zweiter Darsteller</Badge> : null}
                  {x.nurAnfrage ? <Badge variant="outline">Nur auf Anfrage</Badge> : null}
                  {x.aktiv ? null : <Badge variant="secondary">Deaktiviert</Badge>}
                </CardFooter>
              ) : null}
            </Card>
          </li>
        ))}
      </Abschnitt>
    </PageShell>
  );
}
