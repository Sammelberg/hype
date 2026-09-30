"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type Control, Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
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
import { ItemCards } from "../../../_components/item-cards";
import { PreviewPane, type PreviewHandle } from "../../../_components/preview-pane";
import {
  SectionCard,
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../_components/sections";

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
        <FieldSet>
          <FieldLegend variant="label">Auswahlmöglichkeiten</FieldLegend>
          <ItemCards
            control={control}
            name={`${base}.options`}
            itemLabel={(j) => `Möglichkeit ${j + 1}`}
            addLabel="Möglichkeit hinzufügen"
            columns={2}
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
        </FieldSet>
      ) : null}
    </div>
  );
}

const SECTIONS: SectionInfo[] = [
  { id: "felder", title: "Felder", zone: "formular" },
  { id: "absenden", title: "Absenden und Bestätigung", zone: "formular" },
];

const kindLabel = (value: string | undefined) => KINDS.find((k) => k.value === value)?.label ?? "";

// The form on /kontakt. It has no draft: „Speichern“ puts it online, the preview shows it then.
export function FormEditor({ form, kontaktId }: { form: FormDoc; kontaktId: number | null }) {
  const router = useRouter();
  const preview = useRef<PreviewHandle>(null);
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
  const fields = useWatch({ control, name: "fields" });
  // After a save the preview reloads the page, which now shows the saved form.
  const [saves, setSaves] = useState(0);
  useEffect(() => {
    if (saves > 0) preview.current?.refresh();
  }, [saves]);

  const submit = handleSubmit(async (input) => {
    setBusy(true);
    const result = await saveFormAction({ id: form.id, input });
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die markierten Felder.");
    rhf.reset(input);
    toast.success("Gespeichert. /kontakt zeigt das Formular so.");
    setSaves((count) => count + 1);
    router.refresh();
  });

  const invalid = [
    ...(formState.errors.fields ? ["felder"] : []),
    ...(formState.errors.submitButtonLabel || formState.errors.confirmationMessage
      ? ["absenden"]
      : []),
  ];

  return (
    <SectionFocusProvider preview={preview}>
      <form onSubmit={submit} noValidate>
        <EditorShell
          backHref={kontaktId ? `/admin/seiten/${kontaktId}` : "/admin/seiten"}
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          backLabel={kontaktId ? "Seite Kontakt" : "Seiten"}
          title="Kontaktformular"
          actions={
            <Button type="submit" size="sm" disabled={busy || !formState.isDirty}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              Speichern
            </Button>
          }
          aside={
            <PreviewPane
              ref={preview}
              path="/kontakt"
              className="sticky top-20 h-[calc(100vh-6.5rem)]"
            />
          }
        >
          <SectionCard
            section={SECTIONS[0]!}
            description="In dieser Reihenfolge auf /kontakt. Der Spam-Schutz (verstecktes Feld, Mindestzeit) läuft unsichtbar dazu."
          >
            <ItemCards
              control={control}
              name="fields"
              itemLabel={(i) => {
                const field = fields?.[i];
                return (field && "label" in field && field.label) || `Feld ${i + 1}`;
              }}
              summary={(i) => {
                const field = fields?.[i];
                const label = field && "label" in field ? field.label : null;
                return (
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate font-medium">
                      {label ||
                        (field?.blockType === "message" ? "Hinweistext" : "Ohne Beschriftung")}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {kindLabel(field?.blockType)}
                      {field && "required" in field && field.required ? ", Pflicht" : ""}
                    </span>
                  </span>
                );
              }}
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
          </SectionCard>
          <SectionCard
            section={SECTIONS[1]!}
            description="Die Schaltfläche unter den Feldern und der Text, der nach dem Absenden an ihrer Stelle steht."
          >
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
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
