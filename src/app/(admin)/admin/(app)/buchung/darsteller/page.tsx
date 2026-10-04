import { PlusIcon, UsersRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/cms/auth/guard";
import { listDarsteller } from "@/buchung/daten/stammdaten";
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

export const metadata: Metadata = { title: "Darsteller" };

export default async function DarstellerPage() {
  await requireRole("admin");
  const personen = await listDarsteller();
  const neu = (
    <Button asChild size="sm">
      <Link href={"/admin/buchung/darsteller/neu" as never}>
        <PlusIcon data-icon="inline-start" /> Neuer Darsteller
      </Link>
    </Button>
  );
  return (
    <PageShell
      title="Darsteller"
      lead="Wer zu den Feiern fährt und welche Figuren er spielt. Danach richtet sich, welche Zeiten die Website anbietet."
      actions={neu}
      wide
    >
      {personen.length === 0 ? (
        <Empty className="rise-in">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersRoundIcon />
            </EmptyMedia>
            <EmptyTitle>Noch kein Darsteller</EmptyTitle>
            <EmptyDescription>
              Ohne Darsteller bietet die Website keine Zeiten an. Legen Sie den ersten an.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{neu}</EmptyContent>
        </Empty>
      ) : (
        <div className="@container">
          <ul role="list" className="grid items-start gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
            {personen.map((p, index) => (
              <li
                key={p.id}
                className="rise-in"
                style={{ "--rise-index": index } as React.CSSProperties}
              >
                <Card className={cardLinkSurface}>
                  <CardHeader>
                    <CardTitle className="truncate text-lg">
                      <CardLink href={`/admin/buchung/darsteller/${p.id}`}>{p.name}</CardLink>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {p.figuren.length > 0 ? p.figuren.join(", ") : "Spielt noch keine Figur"}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    {p.aktiv ? (
                      <span className="truncate">{p.telefon ?? p.email ?? ""}</span>
                    ) : (
                      <Badge variant="secondary">Nicht in der Planung</Badge>
                    )}
                    <span className="tabular-nums">Reihenfolge {p.prioritaet}</span>
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
