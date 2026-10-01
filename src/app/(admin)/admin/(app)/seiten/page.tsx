import { ArrowDownUpIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/cms/auth/guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { flattenTree } from "@/cms/content/page-tree";
import { listPages } from "@/cms/content/pages";
import { CardLink, cardLinkSurface, tileLinkSurface } from "../../_components/card-link";
import { PageShell } from "../../_components/page-shell";
import { StatusBadge } from "../../_components/status-badge";

export const metadata: Metadata = { title: "Seiten" };

const when = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

// One card per section of the site: a top-level page, and inside it the pages below it as
// tiles, in the navigation's order (changed under Reihenfolge). Columns
// rather than a grid, so a long section does not leave holes beside it.
export default async function PagesPage() {
  await requireUser();
  const pages = await listPages();
  const rows = flattenTree(
    pages.map((p) => ({ ...p, parentId: p.parent })),
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const sections: { page: (typeof rows)[number]; children: typeof rows }[] = [];
  for (const row of rows) {
    const current = sections.at(-1);
    if (row.depth === 0 || !current) sections.push({ page: row, children: [] });
    else current.children.push(row);
  }

  return (
    <PageShell
      title="Seiten"
      lead="Jede veröffentlichte Seite steht in der Navigation und im Fußbereich der Website."
      actions={
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href={"/admin/seiten/reihenfolge" as never}>
              <ArrowDownUpIcon data-icon="inline-start" /> Reihenfolge
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={"/admin/seiten/neu" as never}>
              <PlusIcon data-icon="inline-start" /> Neue Seite
            </Link>
          </Button>
        </>
      }
      wide
    >
      <div className="@container">
        <ul role="list" className="gap-4 @2xl:columns-2 @6xl:columns-3">
          {sections.map(({ page, children }, index) => (
            <li
              key={page.id}
              className="rise-in mb-4 break-inside-avoid"
              style={{ "--rise-index": index } as React.CSSProperties}
            >
              <Card className={cardLinkSurface}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <CardLink href={`/admin/seiten/${page.id}`}>{page.title}</CardLink>
                  </CardTitle>
                  <CardDescription className="truncate font-mono text-xs">
                    {page.path}
                  </CardDescription>
                  <CardAction>
                    <StatusBadge
                      status={page.status}
                      hasDraft={page.hasDraft}
                      publishAt={page.publishAt}
                    />
                  </CardAction>
                </CardHeader>
                {children.length > 0 ? (
                  <CardContent>
                    <ul
                      role="list"
                      aria-label={`Seiten unter ${page.title}`}
                      className="flex flex-col gap-2"
                    >
                      {children.map((child) => (
                        <li
                          key={child.id}
                          className={`${tileLinkSurface} flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5`}
                          style={{ marginLeft: `${(child.depth - 1) * 1.25}rem` }}
                        >
                          <div className="flex min-w-0 flex-col">
                            <CardLink
                              tile
                              href={`/admin/seiten/${child.id}`}
                              className="truncate font-medium"
                            >
                              {child.title}
                            </CardLink>
                            <span className="truncate font-mono text-xs text-muted-foreground">
                              {child.path}
                            </span>
                          </div>
                          <StatusBadge
                            status={child.status}
                            hasDraft={child.hasDraft}
                            publishAt={child.publishAt}
                          />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                ) : null}
                <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
                  <span>Geändert {when.format(page.updatedAt)}</span>
                  {children.length > 0 ? (
                    <span>
                      {children.length} {children.length === 1 ? "Unterseite" : "Unterseiten"}
                    </span>
                  ) : null}
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
