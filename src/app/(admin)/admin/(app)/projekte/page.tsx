import { FolderKanbanIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listProjekte } from "@/cms/content/projekte";
import { PageShell } from "../../_components/page-shell";
import { StatusBadge } from "../../_components/status-badge";

export const metadata: Metadata = { title: "Projekte" };

const when = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

export default async function ProjektePage() {
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead className="hidden md:table-cell">Kunde</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Geändert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projekte.map((projekt, index) => (
              <TableRow
                key={projekt.id}
                className="rise-in"
                style={{ "--rise-index": index } as React.CSSProperties}
              >
                <TableCell className="font-medium">
                  <Link href={`/admin/projekte/${projekt.id}` as never} className="hover:underline">
                    {projekt.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {projekt.kunde}
                </TableCell>
                <TableCell>
                  <StatusBadge status={projekt.status} hasDraft={projekt.hasDraft} />
                </TableCell>
                <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                  {when.format(projekt.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PageShell>
  );
}
