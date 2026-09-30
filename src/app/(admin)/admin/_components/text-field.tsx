"use client";

import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// One labelled text field of a document form: input or textarea, its hint and its error.
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  multiline = false,
  rows = 3,
  maxLength,
  placeholder,
  className,
  inputClassName,
  hideLabel = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms ("" → null) have another output type
  control: Control<T, any, any>;
  name: Path<T>;
  label: string;
  description?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** For a lone field whose card already names it: the label stays for screen readers. */
  hideLabel?: boolean;
}) {
  const id = `feld-${name.replace(/\W+/g, "-")}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className={className}>
          <FieldLabel htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
            {label}
          </FieldLabel>
          {multiline ? (
            <Textarea
              id={id}
              {...field}
              value={(field.value as string | null) ?? ""}
              rows={rows}
              maxLength={maxLength}
              placeholder={placeholder}
              className={inputClassName}
              aria-invalid={fieldState.invalid || undefined}
            />
          ) : (
            <Input
              id={id}
              {...field}
              value={(field.value as string | null) ?? ""}
              maxLength={maxLength}
              placeholder={placeholder}
              className={inputClassName}
              aria-invalid={fieldState.invalid || undefined}
            />
          )}
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
        </Field>
      )}
    />
  );
}
