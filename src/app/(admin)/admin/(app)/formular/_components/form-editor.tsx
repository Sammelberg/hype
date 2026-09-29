"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Control, Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { type FormDoc, type FormInput, FormInputSchema } from "@/cms/content/types";
import { saveFormAction } from "../../../_actions/forms";
import { EditorShell } from "../../../_components/editor-shell";
import { LexicalEditor } from "../../../_components/lexical-editor/editor";
import { ListFields } from "../../einstellungen/_components/list-fields";

const KINDS = [
  { value: "text", label: "Textzeile" },
  { value: "textarea", label: "Mehrzeiliger Text" },
  { value: "email", label: "E-Mail-Adresse" },
  { value: "number", label: "Zahl" },
  { value: "checkbox", label: "Ankreuzfeld" },
  { value: "select", label: "Auswahl" },
  { value: "message", label: "Hinweistext" },
] as const;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    : String(Math.random()).slice(2, 18);

function FieldRow({ control, index }: { control: Control<FormInput>; index: number }) {
  const kind = useWatch({ control, name: `fields.${index}.blockType` });
  const base = `fields.${index}` as const;
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <Controller
          control={control}
          name={`${base}.blockType`}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={`${base}-kind`}>Art</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`${base}-kind`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {KINDS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        {kind === "message" ? null : (
          <Controller
            control={control}
            name={`${base}.label`}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={`${base}-label`}>Beschriftung</FieldLabel>
                <Input
                  id={`${base}-label`}
                  {...field}
                  value={(field.value as string | null) ?? ""}
                  aria-invalid={fieldState.invalid || undefined}
                />
                {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
              </Field>
            )}
          />
        )}
      </div>
      {kind === "message" ? (
        <Controller
          control={control}
          name={`${base}.message`}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={`${base}-message`}>Text</FieldLabel>
              <LexicalEditor
                id={`${base}-message`}
                label="Hinweistext"
                value={(field.value as FormInput["confirmationMessage"]) ?? null}
                onChange={field.onChange}
                className="[&_[contenteditable]]:min-h-24"
              />
            </Field>
          )}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Controller
            control={control}
            name={`${base}.name`}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={`${base}-name`}>Feldname</FieldLabel>
                <Input
                  id={`${base}-name`}
                  {...field}
                  value={(field.value as string) ?? ""}
                  className="font-mono"
                  aria-invalid={fieldState.invalid || undefined}
                />
                <FieldDescription>
                  Technisch, erscheint in den Anfragen als Spalte.
                </FieldDescription>
                {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
              </Field>
            )}
          />
          <Controller
            control={control}
            name={`${base}.required`}
            render={({ field }) => (
              <Field orientation="horizontal" className="items-center pt-6">
                <Switch
                  id={`${base}-required`}
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor={`${base}-required`}>Pflicht</FieldLabel>
              </Field>
            )}
          />
          <Controller
            control={control}
            name={`${base}.width`}
            render={({ field }) => (
              <Field orientation="horizontal" className="items-center pt-6">
                <Switch
                  id={`${base}-half`}
                  checked={field.value === 50}
                  onCheckedChange={(on) => field.onChange(on ? 50 : null)}
                />
                <FieldLabel htmlFor={`${base}-half`}>Halbe Breite</FieldLabel>
              </Field>
            )}
          />
        </div>
      )}
      {kind === "select" ? (
        <ListFields
          control={control}
          name={`${base}.options`}
          legend="Auswahlmöglichkeiten"
          addLabel="Möglichkeit hinzufügen"
          make={() => ({ id: newId(), label: "", value: "" })}
          render={(j) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Controller
                control={control}
                name={`${base}.options.${j}.label`}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`${base}-o-${j}-label`}>Angezeigt</FieldLabel>
                    <Input
                      id={`${base}-o-${j}-label`}
                      {...field}
                      value={(field.value as string) ?? ""}
                    />
                  </Field>
                )}
              />
              <Controller
                control={control}
                name={`${base}.options.${j}.value`}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`${base}-o-${j}-value`}>Gespeichert als</FieldLabel>
                    <Input
                      id={`${base}-o-${j}-value`}
                      {...field}
                      value={(field.value as string) ?? ""}
                      className="font-mono"
                    />
                  </Field>
                )}
              />
            </div>
          )}
        />
      ) : null}
    </div>
  );
}

export function FormEditor({ form }: { form: FormDoc }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const rhf = useForm<FormInput>({
    resolver: zodResolver(FormInputSchema),
    defaultValues: {
      title: form.title,
      fields: form.fields,
      submitButtonLabel: form.submitButtonLabel,
      confirmationMessage: form.confirmationMessage,
    },
    mode: "onBlur",
  });
  const { control, handleSubmit, formState } = rhf;

  const submit = handleSubmit(async (input) => {
    setBusy(true);
    const result = await saveFormAction({ id: form.id, input });
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die markierten Felder.");
    rhf.reset(input);
    toast.success("Gespeichert. /kontakt zeigt das Formular so.");
    router.refresh();
  });

  return (
    <form onSubmit={submit} noValidate>
      <EditorShell
        backHref="/admin"
        backLabel="Übersicht"
        title="Kontaktformular"
        actions={
          <Button type="submit" size="sm" disabled={busy || !formState.isDirty}>
            {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            Speichern
          </Button>
        }
      >
        <FieldGroup>
          <ListFields
            control={control}
            name="fields"
            legend="Felder"
            description="In dieser Reihenfolge auf /kontakt. Der Spam-Schutz (Honeypot, Mindestzeit) läuft unsichtbar dazu."
            addLabel="Feld hinzufügen"
            min={1}
            make={() => ({
              id: newId(),
              blockType: "text" as const,
              name: "",
              label: "",
              required: false,
              width: null,
              defaultValue: null,
            })}
            render={(i) => <FieldRow control={control} index={i} />}
          />
          <Controller
            control={control}
            name="submitButtonLabel"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="max-w-md">
                <FieldLabel htmlFor="form-submit">Beschriftung der Schaltfläche</FieldLabel>
                <Input
                  id="form-submit"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Nachricht senden"
                  aria-invalid={fieldState.invalid || undefined}
                />
                {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="confirmationMessage"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="form-confirmation">Bestätigung nach dem Absenden</FieldLabel>
                <LexicalEditor
                  id="form-confirmation"
                  label="Bestätigungstext"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  className="[&_[contenteditable]]:min-h-32"
                />
              </Field>
            )}
          />
        </FieldGroup>
      </EditorShell>
    </form>
  );
}
