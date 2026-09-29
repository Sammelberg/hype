"use client";

import { HistoryIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import type { Version } from "@/cms/content/types";

const when = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });
const KIND: Record<Version["kind"], string> = {
  published: "Veröffentlicht",
  manual: "Gespeichert",
  restored: "Wiederhergestellt",
};

// Every published state of a document, newest first. Restoring copies one into the draft;
// nothing goes live until it is published again.
export function VersionsSheet({
  versions,
  onRestore,
}: {
  versions: Version[];
  onRestore: (versionId: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <HistoryIcon data-icon="inline-start" /> Versionen
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Versionen</SheetTitle>
          <SheetDescription>
            Jede Veröffentlichung wird aufgehoben. „Wiederherstellen“ lädt sie in den Entwurf;
            veröffentlicht wird erst, wenn Sie es sagen.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {versions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Noch keine Version</EmptyTitle>
                <EmptyDescription>
                  Die erste entsteht mit der ersten Veröffentlichung.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup>
              {versions.map((version, index) => (
                <Item
                  key={version.id}
                  role="listitem"
                  variant="outline"
                  size="sm"
                  className="rise-in"
                  style={{ "--rise-index": index } as React.CSSProperties}
                >
                  <ItemContent>
                    <ItemTitle>{when.format(version.createdAt)}</ItemTitle>
                    <ItemDescription>
                      {KIND[version.kind]}
                      {version.createdBy ? ` · ${version.createdBy.name}` : ""}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy !== null}
                      onClick={async () => {
                        setBusy(version.id);
                        try {
                          await onRestore(version.id);
                          setOpen(false);
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      {busy === version.id ? <Spinner data-icon="inline-start" /> : null}
                      Wiederherstellen
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
