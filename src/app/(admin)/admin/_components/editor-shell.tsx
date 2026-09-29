"use client";

import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { DocStatus } from "@/cms/content/types";
import { SaveIndicator } from "./save-indicator";
import { StatusBadge } from "./status-badge";
import type { SaveState } from "./use-autosave";

// The frame of every document editor: a sticky bar with the way back, title and status on the
// left, the draft's state and the actions on the right; the form below, the preview beside it.
export function EditorShell({
  backHref,
  backLabel,
  title,
  status,
  hasDraft,
  saveState,
  actions,
  onDelete,
  deleteLabel = "Löschen",
  deleteDescription,
  children,
  aside,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  status?: DocStatus;
  hasDraft?: boolean;
  saveState?: SaveState;
  actions?: ReactNode;
  onDelete?: () => Promise<void>;
  deleteLabel?: string;
  deleteDescription?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-3 border-b bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={backHref as never}>
            <ArrowLeftIcon data-icon="inline-start" /> {backLabel}
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h1 className="truncate text-lg font-semibold tracking-tight">{title || "Ohne Titel"}</h1>
          {status ? <StatusBadge status={status} hasDraft={hasDraft ?? false} /> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveState ? <SaveIndicator state={saveState} /> : null}
          {actions}
          {onDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={deleteLabel}>
                  <Trash2Icon />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{deleteLabel}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {deleteDescription ?? "Das lässt sich nicht rückgängig machen."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => void onDelete()}>
                    {deleteLabel}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>
      <div
        className={
          aside
            ? "grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 3xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
            : ""
        }
      >
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
        {aside ? <div className="hidden min-w-0 xl:block">{aside}</div> : null}
      </div>
    </div>
  );
}
