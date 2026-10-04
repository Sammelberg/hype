import { PlusIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/cms/auth/guard";
import { listFiguren } from "@/buchung/daten/stammdaten";
import { KATEGORIE_NAMEN } from "@/buchung/logik/typen";
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
import { CardLink, cardLinkSurface } from "../../../_components/card-link";
import { PageShell } from "../../../_components/page-shell";

export const metadata: Metadata = { title: "Figuren" };

export default async function FigurenPage() {
  await requireRole("admin");
  const figuren = await listFiguren();
  const neu = (
    <Button asChild size="sm">
      <Link href={"/admin/buchung/figuren/neu" as never}>
        <PlusIcon data-icon="inline-start" /> Neue Figur
      </Link>
    </Button>
  );
  return (
    <PageShell
      title="Figuren"
      lead="Wer zur Feier kommt. Buchbar ist eine Figur, wenn sie aktiv ist und mindestens ein Darsteller sie spielt."
      actions={neu}
      wide
    >
      {figuren.length === 0 ? (
        <Empty className="rise-in">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SparklesIcon />
            </EmptyMedia>
            <EmptyTitle>Noch keine Figur</EmptyTitle>
            <EmptyDescription>
              Legen Sie die erste Figur an, mit beschreibendem Namen und eigenen Fotos.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{neu}</EmptyContent>
        </Empty>
      ) : (
        <div className="@container">
          <ul role="list" className="grid items-start gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
            {figuren.map((f, index) => (
              <li
                key={f.id}
                className="rise-in"
                style={{ "--rise-index": index } as React.CSSProperties}
              >
                <Card className={cardLinkSurface}>
                  <CardHeader>
                    <CardTitle className="truncate text-lg">
                      <CardLink href={`/admin/buchung/figuren/${f.id}`}>{f.name}</CardLink>
                    </CardTitle>
                    <CardDescription>{KATEGORIE_NAMEN[f.kategorie]}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex-wrap gap-2">
                    {f.aktiv ? null : <Badge variant="secondary">Deaktiviert</Badge>}
                    {f.darsteller === 0 ? (
                      <Badge variant="destructive">Kein Darsteller</Badge>
                    ) : (
                      <Badge variant="outline">{f.darsteller} Darsteller</Badge>
                    )}
                    {f.fotos < 3 ? (
                      <Badge variant="destructive">
                        {f.fotos} {f.fotos === 1 ? "Foto" : "Fotos"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{f.fotos} Fotos</Badge>
                    )}
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageShell>
  );
}
