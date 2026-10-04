"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { ActionFailure } from "../../_actions/client";

type Ergebnis<D> = { data?: D; serverError?: ActionFailure; validationErrors?: unknown };

// Saving and deleting in the booking master data's editors: errors land on their field, a new
// record opens under its own address, a saved one refreshes in place.
export function useSpeichern(listeHref: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function speichern<D>(
    lauf: () => Promise<Ergebnis<D> | undefined>,
    o: {
      /** The address of a newly created record; absent when an existing one was saved. */
      neuHref?: (data: D) => string;
      feldFehler: (feld: string, message: string) => void;
      gespeichert: () => void;
    },
  ) {
    setBusy(true);
    const result = await lauf();
    setBusy(false);
    if (!result) return;
    if (result.serverError) {
      if (result.serverError.field)
        o.feldFehler(result.serverError.field, result.serverError.message);
      return void toast.error(result.serverError.message);
    }
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die markierten Felder.");
    if (o.neuHref && result.data !== undefined) {
      toast.success("Angelegt.");
      return router.replace(o.neuHref(result.data) as never);
    }
    o.gespeichert();
    toast.success("Gespeichert.");
    router.refresh();
  }

  async function loeschen(lauf: () => Promise<Ergebnis<unknown> | undefined>, meldung: string) {
    const result = await lauf();
    if (result?.serverError) return void toast.error(result.serverError.message);
    toast.success(meldung);
    router.push(listeHref as never);
  }

  return { busy, speichern, loeschen };
}
