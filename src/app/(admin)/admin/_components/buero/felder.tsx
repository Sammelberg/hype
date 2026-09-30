"use client";

import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// The office's form fields beside TextField: a choice, a date, a number, a switch. Each keeps its
// label, hint and error together, like TextField.
const feldId = (name: string) => `feld-${name.replace(/\W+/g, "-")}`;

export function AuswahlFeld<T extends FieldValues>({
  control,
  name,
  label,
  optionen,
  leer,
  description,
  zahl = false,
  onAuswahl,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms ("" → null) have another output type
  control: Control<T, any, any>;
  name: Path<T>;
  label: string;
  optionen: { value: string; label: string }[];
  /** A choice for „none“; the field then stores null. */
  leer?: string;
  description?: string;
  /** Store the value as a number (ids). */
  zahl?: boolean;
  /** After a choice, with the stored value. */
  onAuswahl?: (value: string | number | null) => void;
}) {
  const id = feldId(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select
            value={
              field.value === null || field.value === undefined ? "__leer" : String(field.value)
            }
            onValueChange={(v) => {
              const wert = v === "__leer" ? null : zahl ? Number(v) : v;
              field.onChange(wert);
              onAuswahl?.(wert);
            }}
          >
            <SelectTrigger
              id={id}
              className="w-full"
              aria-invalid={fieldState.invalid || undefined}
            >
              <SelectValue placeholder={leer ?? "Bitte wählen"} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {leer ? <SelectItem value="__leer">{leer}</SelectItem> : null}
                {optionen.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
        </Field>
      )}
    />
  );
}

export function DatumFeld<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms ("" → null) have another output type
  control: Control<T, any, any>;
  name: Path<T>;
  label: string;
  description?: string;
}) {
  const id = feldId(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            id={id}
            type="date"
            {...field}
            value={(field.value as string | null) ?? ""}
            onChange={(e) => field.onChange(e.target.value || null)}
            aria-invalid={fieldState.invalid || undefined}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
        </Field>
      )}
    />
  );
}

export function ZahlFeld<T extends FieldValues>({
  control,
  name,
  label,
  description,
  einheit,
  leerIstNull = true,
  hideLabel = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms ("" → null) have another output type
  control: Control<T, any, any>;
  name: Path<T>;
  label: string;
  description?: string;
  /** Shown after the number: „€“, „Monate“. */
  einheit?: string;
  leerIstNull?: boolean;
  hideLabel?: boolean;
}) {
  const id = feldId(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
            {label}
          </FieldLabel>
          <div className="relative">
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              step="any"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value === null || field.value === undefined ? "" : String(field.value)}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? (leerIstNull ? null : 0) : Number(e.target.value),
                )
              }
              className={einheit ? "pr-16 tabular-nums" : "tabular-nums"}
              aria-invalid={fieldState.invalid || undefined}
            />
            {einheit ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
              >
                {einheit}
              </span>
            ) : null}
          </div>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
        </Field>
      )}
    />
  );
}

export function SchalterFeld<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms ("" → null) have another output type
  control: Control<T, any, any>;
  name: Path<T>;
  label: string;
  description?: string;
}) {
  const id = feldId(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal" className="items-start">
          <Switch id={id} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {description ? <FieldDescription>{description}</FieldDescription> : null}
          </div>
        </Field>
      )}
    />
  );
}
