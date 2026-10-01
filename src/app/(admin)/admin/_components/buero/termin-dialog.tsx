"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { type TerminInput, TerminSchema } from "@/buero/logik/typen";
import { createTerminAction, deleteTerminAction, updateTerminAction } from "../../_actions/termine";
import { TextField } from "../text-field";
import { AuswahlFeld, DatumFeld, SchalterFeld } from "./felder";

export type KundeKurz = { id: number; name: string };

/** A new Termin on a day: at nine for an hour, or all day. */
export const neuerTermin = (datum: string, kundeId: number | null = null): TerminInput => ({
  titel: "",
  datum,
  bisDatum: null,
  ganztags: false,
  von: "09:00",
  bis: "10:00",
  ort: null,
  notiz: null,
  kundeId,
});

function Uhrzeit({
  id,
  label,
  value,
  onChange,
  fehler,
}: {
  id: string;
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  fehler?: string;
}) {
  return (
    <Field data-invalid={fehler ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="time"
        step={300}
        value={value ?? ""}
        aria-invalid={fehler ? true : undefined}
        onChange={(e) => onChange(e.target.value || null)}
      />
      {fehler ? <FieldError>{fehler}</FieldError> : null}
    </Field>
  );
}

// One Termin, new or existing: what, when (at a time or all day, over one or several days),
// where, with whom. Its own form in a dialog, portalled out of any page form.
export function TerminDialog({
  offen,
  onOffen,
  terminId,
  werte,
  kunden,
}: {
  offen: boolean;
  onOffen: (offen: boolean) => void;
  /** null: a new Termin. */
  terminId: number | null;
  werte: TerminInput;
  kunden: KundeKurz[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const form = useForm({ resolver: zodResolver(TerminSchema), values: werte, mode: "onSubmit" });
  const { control, handleSubmit, setValue, formState } = form;
  const ganztags = useWatch({ control, name: "ganztags" });
  const von = useWatch({ control, name: "von" });
  const bis = useWatch({ control, name: "bis" });

  const senden = handleSubmit(async (input) => {
    setBusy(true);
    const result = terminId
      ? await updateTerminAction({ id: terminId, input })
      : await createTerminAction(input);
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die markierten Felder.");
    onOffen(false);
    toast.success(terminId ? "Termin gespeichert." : "Termin eingetragen.");
    router.refresh();
  });

  const loeschen = async () => {
    if (!terminId) return;
    const result = await deleteTerminAction({ id: terminId });
    if (result.serverError) return void toast.error(result.serverError.message);
    onOffen(false);
    toast.success("Termin gelöscht.");
    router.refresh();
  };

  return (
    <Dialog open={offen} onOpenChange={onOffen}>
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            void senden(e);
          }}
          noValidate
          className="flex flex-col gap-5"
        >
          <DialogHeader>
            <DialogTitle>{terminId ? "Termin" : "Neuer Termin"}</DialogTitle>
            <DialogDescription>
              Steht im Kalender und, mit Kunde, auf seiner Karte.
            </DialogDescription>
          </DialogHeader>
          <TextField control={control} name="titel" label="Was" />
          <SchalterFeld control={control} name="ganztags" label="Ganztägig" />
          <div className="grid gap-4 sm:grid-cols-2">
            <DatumFeld control={control} name="datum" label="Am" />
            <DatumFeld
              control={control}
              name="bisDatum"
              label="Bis"
              description="Nur bei mehreren Tagen."
            />
          </div>
          {ganztags ? null : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Uhrzeit
                id="termin-von"
                label="Von"
                value={von ?? null}
                onChange={(v) => setValue("von", v, { shouldDirty: true })}
                fehler={formState.errors.von?.message}
              />
              <Uhrzeit
                id="termin-bis"
                label="Bis"
                value={bis ?? null}
                onChange={(v) => setValue("bis", v, { shouldDirty: true })}
                fehler={formState.errors.bis?.message}
              />
            </div>
          )}
          <TextField control={control} name="ort" label="Ort" placeholder="Beim Kunden, online …" />
          <AuswahlFeld
            control={control}
            name="kundeId"
            label="Kunde"
            zahl
            leer="Ohne Kunde"
            optionen={kunden.map((k) => ({ value: String(k.id), label: k.name }))}
          />
          <TextField control={control} name="notiz" label="Notiz" multiline rows={2} />
          <DialogFooter className="sm:justify-between">
            {terminId ? (
              <Button type="button" variant="ghost" onClick={() => void loeschen()}>
                <Trash2Icon data-icon="inline-start" /> Löschen
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              {terminId ? "Speichern" : "Eintragen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
