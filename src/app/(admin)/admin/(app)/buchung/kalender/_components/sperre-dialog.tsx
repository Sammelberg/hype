"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type RefObject, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { SperreSchema, type SperreInput } from "@/buchung/logik/schemas";
import { sperreAction } from "../../../../_actions/buchung";
import { AuswahlFeld, DatumFeld } from "../../../../_components/buero/felder";
import { UhrzeitFeld } from "../../../../_components/buchung/felder";
import { TextField } from "../../../../_components/text-field";

export type SperreVorschlag = Partial<SperreInput>;

// Time off for a Darsteller: holiday, illness, a private appointment. Refused over a planned
// Einsatz — the message names the booking to move first.
export function SperreDialog({
  offen,
  onOffen,
  vorschlag,
  darsteller,
  ausloeser,
}: {
  offen: boolean;
  onOffen: (offen: boolean) => void;
  vorschlag: SperreVorschlag;
  darsteller: { id: number; name: string }[];
  /** What opened the dialog: it gets the focus back on close. */
  ausloeser?: RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const form = useForm({
    resolver: zodResolver(SperreSchema),
    defaultValues: {
      darstellerId: 0,
      vonTag: "",
      vonZeit: "09:00",
      bisTag: "",
      bisZeit: "18:00",
      grund: null,
    } satisfies SperreInput,
  });
  const { control, handleSubmit, reset, setError } = form;

  useEffect(() => {
    if (offen)
      reset({
        darstellerId: vorschlag.darstellerId ?? darsteller[0]?.id ?? 0,
        vonTag: vorschlag.vonTag ?? "",
        vonZeit: vorschlag.vonZeit ?? "09:00",
        bisTag: vorschlag.bisTag ?? vorschlag.vonTag ?? "",
        bisZeit: vorschlag.bisZeit ?? "18:00",
        grund: null,
      });
  }, [offen, vorschlag, darsteller, reset]);

  const absenden = handleSubmit(async (input) => {
    setBusy(true);
    const result = await sperreAction(input);
    setBusy(false);
    if (result?.serverError) {
      if (result.serverError.field)
        setError(result.serverError.field as keyof SperreInput, {
          message: result.serverError.message,
        });
      return void toast.error(result.serverError.message);
    }
    if (result?.validationErrors) return void toast.error("Bitte prüfen Sie die Angaben.");
    toast.success("Zeit gesperrt.");
    onOffen(false);
    router.refresh();
  });

  return (
    <Dialog open={offen} onOpenChange={onOffen}>
      <DialogContent
        onCloseAutoFocus={(e) => {
          if (!ausloeser?.current) return;
          e.preventDefault();
          ausloeser.current.focus();
        }}
      >
        <form onSubmit={absenden} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Zeit sperren</DialogTitle>
            <DialogDescription>
              In dieser Zeit bietet die Website den Darsteller nicht an.
            </DialogDescription>
          </DialogHeader>
          <AuswahlFeld
            control={control}
            name="darstellerId"
            label="Darsteller"
            zahl
            optionen={darsteller.map((d) => ({ value: String(d.id), label: d.name }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <DatumFeld control={control} name="vonTag" label="Von (Tag)" />
            <UhrzeitFeld control={control} name="vonZeit" label="Uhrzeit" />
            <DatumFeld control={control} name="bisTag" label="Bis (Tag)" />
            <UhrzeitFeld control={control} name="bisZeit" label="Uhrzeit" />
          </div>
          <TextField
            control={control}
            name="grund"
            label="Grund"
            description="Nur intern: Urlaub, krank, privat."
            maxLength={300}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOffen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Sperren
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
