"use client";

import { CheckIcon, CloudOffIcon, LoaderCircleIcon } from "lucide-react";

import type { SaveState } from "./use-autosave";

const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" });

// A quiet line that says where the draft stands; announced politely, never with a toast.
export function SaveIndicator({ state }: { state: SaveState }) {
  const content = (() => {
    switch (state.status) {
      case "dirty":
        return <>Ungespeicherte Änderungen</>;
      case "saving":
        return (
          <>
            <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden="true" /> Speichert …
          </>
        );
      case "saved":
        return (
          <>
            <CheckIcon className="text-success size-3.5" aria-hidden="true" /> Entwurf gespeichert
            {state.at ? ` · ${time.format(state.at)}` : ""}
          </>
        );
      case "error":
        return (
          <>
            <CloudOffIcon className="size-3.5 text-destructive" aria-hidden="true" />{" "}
            {state.message ?? "Nicht gespeichert"}
          </>
        );
      default:
        return null;
    }
  })();
  return (
    <p
      aria-live="polite"
      className="flex min-h-5 items-center gap-1.5 text-sm text-muted-foreground"
    >
      {content}
    </p>
  );
}
