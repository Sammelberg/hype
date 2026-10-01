import { FolderKanbanIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/cms/auth/guard";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listProjekte } from "@/cms/content/projekte";
import { CardLink, cardLinkSurface } from "../../_components/card-link";
import { PageShell } from "../../_components/page-shell";
import { StatusBadge } from "../../_components/status-badge";

export const metadata: Metadata = { title: "Projekte" };

const when = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

export default async function ProjektePage() {
  await requireUser();
  const projekte = await listProjekte();
  const newButton = (
    <Button asChild size="sm">
      <Link href={"/admin/projekte/neu" as never}>
        <PlusIcon data-icon="inline-start" /> Neues Projekt
      </Link>
    </Button>
  );
  return (
    <PageShell
      title="Projekte"
      lead="Veröffentlichte Projekte stehen unter /projekte und im Menü „Projekte“."
      actions={newButton}
      wide
    >
      {projekte.length === 0 ? (
        <Empty className="rise-in">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanbanIcon />
            </EmptyMedia>
            <EmptyTitle>Noch kein Projekt</EmptyTitle>
            <EmptyDescription>
              Ein Projekt braucht einen Kunden, zwei Sätze Zusammenfassung und den Text dazu.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{newButton}</EmptyContent>
        </Empty>
      ) : (
        <div className="@container">
          <ul role="list" className="grid items-start gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
            {projekte.map((projekt, index) => (
              <li
                key={projekt.id}
                className="rise-in"
                style={{ "--rise-index": index } as React.CSSProperties}
              >
                <Card className={cardLinkSurface}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <CardLink href={`/admin/projekte/${projekt.id}`}>{projekt.title}</CardLink>
                    </CardTitle>
                    <CardDescription>{projekt.kunde}</CardDescription>
                    <CardAction>
                      <StatusBadge
                        status={projekt.status}
                        hasDraft={projekt.hasDraft}
                        publishAt={projekt.publishAt}
                      />
                    </CardAction>
                  </CardHeader>
                  {projekt.summary ? (
                    <CardContent>
                      <p className="line-clamp-3 text-pretty">{projekt.summary}</p>
                    </CardContent>
                  ) : null}
                  <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
                    <span className="truncate font-mono">{projekt.path}</span>
                    <span className="shrink-0">Geändert {when.format(projekt.updatedAt)}</span>
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
