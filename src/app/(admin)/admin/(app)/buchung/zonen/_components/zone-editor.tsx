"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ZoneSchema, type ZoneInput } from "@/buchung/logik/schemas";
import { loescheZoneAction, speichereZoneAction } from "../../../../_actions/buchung";
import { SchalterFeld, ZahlFeld } from "../../../../_components/buero/felder";
import { useSpeichern } from "../../../../_components/buchung/speichern";
import { EditorShell } from "../../../../_components/editor-shell";
import { SectionCard, SectionFocusProvider } from "../../../../_components/sections";
import { TextField } from "../../../../_components/text-field";

const LEER: ZoneInput = {
  code: "",
  name: "",
  aufschlag: 0,
  fahrtMinuten: 30,
  nurAnfrage: false,
  sort: 0,
};

// A ring of distance from Aschaffenburg: its surcharge is a line of the price, its travel time is
// part of every Fenster there.
export function ZoneEditor({ code, zone }: { code: string | null; zone: ZoneInput | null }) {
  const { busy, speichern, loeschen } = useSpeichern("/admin/buchung/gebiet");
  const form = useForm({
    resolver: zodResolver(ZoneSchema),
    defaultValues: zone ?? LEER,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, setError } = form;

  const absenden = handleSubmit((input) =>
    speichern(() => speichereZoneAction({ code, input }), {
      neuHref: code ? undefined : (d) => `/admin/buchung/zonen/${d.code}`,
      feldFehler: (feld, message) => setError(feld as keyof ZoneInput, { message }),
      gespeichert: () => reset(input),
    }),
  );

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={absenden} noValidate>
        <EditorShell
          backHref="/admin/buchung/gebiet"
          backLabel="Zonen & Orte"
          title={code ? (zone?.name ?? "Zone") : "Neue Zone"}
          onDelete={
            code ? () => loeschen(() => loescheZoneAction({ code }), "Zone gelöscht.") : undefined
          }
          deleteLabel="Zone löschen"
          deleteDescription="Nur ohne Orte und Buchungen."
          actions={
            <Button
              type="submit"
              size="sm"
              disabled={busy || (Boolean(code) && !formState.isDirty)}
            >
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              {code ? "Speichern" : "Zone anlegen"}
            </Button>
          }
        >
          <SectionCard
            section={{ id: "zone", title: "Zone" }}
            description="Fahrzeit einfach, ab Aschaffenburg. Hin und zurück blockieren den Darsteller zusätzlich zur Feier."
          >
            <div className="grid gap-6 sm:grid-cols-[8rem_1fr]">
              <Controller
                control={control}
                name="code"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="feld-code">Kürzel</FieldLabel>
                    <Input
                      id="feld-code"
                      {...field}
                      maxLength={2}
                      disabled={Boolean(code)}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    {code ? <FieldDescription>Bleibt fest.</FieldDescription> : null}
                    {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                  </Field>
                )}
              />
              <TextField control={control} name="name" label="Name" maxLength={100} />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <ZahlFeld
                control={control}
                name="aufschlag"
                label="Aufschlag"
                einheit="€"
                leerIstNull={false}
              />
              <ZahlFeld
                control={control}
                name="fahrtMinuten"
                label="Fahrzeit einfach"
                einheit="Minuten"
                leerIstNull={false}
              />
            </div>
            <SchalterFeld
              control={control}
              name="nurAnfrage"
              label="Nur auf Anfrage"
              description="Für weite Ziele (Nürnberg und weiter): keine Buchung auf der Website, nur eine Anfrage."
            />
            <ZahlFeld control={control} name="sort" label="Reihenfolge" leerIstNull={false} />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
