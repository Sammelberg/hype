import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flattenTree } from "@/cms/content/page-tree";
import { listPages } from "@/cms/content/pages";
import { PageShell } from "../../_components/page-shell";
import { StatusBadge } from "../../_components/status-badge";

export const metadata: Metadata = { title: "Seiten" };

const when = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

// The tree as a list: children indented under their parent, in the order they were created —
// the order the navigation shows them in.
export default async function PagesPage() {
  const pages = await listPages();
  const rows = flattenTree(
    pages.map((p) => ({ ...p, parentId: p.parent })),
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id,
  );
  return (
    <PageShell
      title="Seiten"
      lead="Jede veröffentlichte Seite steht in der Navigation und im Fußbereich der Website."
      actions={
        <Button asChild size="sm">
          <Link href={"/admin/seiten/neu" as never}>
            <PlusIcon data-icon="inline-start" /> Neue Seite
          </Link>
        </Button>
      }
      wide
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titel</TableHead>
            <TableHead className="hidden md:table-cell">Adresse</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Geändert</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={row.id}
              className="rise-in"
              style={{ "--rise-index": index } as React.CSSProperties}
            >
              <TableCell className="font-medium">
                <Link
                  href={`/admin/seiten/${row.id}` as never}
                  className="flex items-center gap-2 hover:underline"
                >
                  {row.depth > 0 ? (
                    <span
                      aria-hidden="true"
                      className="text-muted-foreground"
                      style={{ marginLeft: `${(row.depth - 1) * 1.25}rem` }}
                    >
                      └
                    </span>
                  ) : null}
                  <span className="truncate">{row.title}</span>
                </Link>
              </TableCell>
              <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                {row.path}
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} hasDraft={row.hasDraft} />
              </TableCell>
              <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                {when.format(row.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PageShell>
  );
}
