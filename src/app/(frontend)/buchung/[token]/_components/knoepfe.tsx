"use client";

import { useState, useTransition } from "react";

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
import { buttonVariants } from "@/components/ui/button";

import type { LinkErgebnis } from "../actions";

// The two buttons behind a booking's link. Cancelling cannot be undone, so it asks first.

export function ZahlenKnopf({
  aktion,
  betrag,
}: {
  aktion: () => Promise<LinkErgebnis>;
  betrag: string;
}) {
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();
  return (
    <div>
      <button
        type="button"
        disabled={laeuft}
        onClick={() =>
          starte(async () => {
            const r = await aktion();
            setFehler(r?.fehler ?? null);
          })
        }
        className={buttonVariants({
          size: "lg",
          className: "h-auto w-full rounded-full py-3.5 text-base font-semibold sm:w-auto sm:px-10",
        })}
      >
        {laeuft ? "Einen Moment …" : `Anzahlung bezahlen: ${betrag}`}
      </button>
      <p role="status" className="mt-2 text-sm font-medium text-destructive">
        {fehler}
      </p>
    </div>
  );
}

export function StornoKnopf({
  aktion,
  folgen,
}: {
  aktion: () => Promise<LinkErgebnis>;
  folgen: string;
}) {
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();
  return (
    <div>
      <AlertDialog>
        <AlertDialogTrigger
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "h-auto rounded-full py-3 text-base",
          })}
        >
          Buchung stornieren
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buchung wirklich stornieren?</AlertDialogTitle>
            <AlertDialogDescription>
              {folgen} Das lässt sich nicht rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nicht stornieren</AlertDialogCancel>
            <AlertDialogAction
              disabled={laeuft}
              onClick={() =>
                starte(async () => {
                  const r = await aktion();
                  setFehler(r?.fehler ?? null);
                })
              }
            >
              Ja, stornieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p role="status" className="mt-2 text-sm font-medium text-destructive">
        {fehler}
      </p>
    </div>
  );
}
