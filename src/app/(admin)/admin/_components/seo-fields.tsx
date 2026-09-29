"use client";

import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MediaDoc } from "@/cms/content/types";
import { MediaPicker } from "./media-picker";

// Title, description and share image — what search engines and messengers show. Empty fields
// fall back to the document's own title and first paragraph.
export function SeoFields<T extends FieldValues>({
  control,
  media,
  fallbackTitle,
}: {
  control: Control<T>;
  media: MediaDoc[];
  fallbackTitle: string;
}) {
  return (
    <FieldGroup>
      <Controller
        control={control}
        name={"meta.title" as Path<T>}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="seo-title">Titel in Suchmaschinen</FieldLabel>
            <Input
              id="seo-title"
              {...field}
              value={field.value ?? ""}
              placeholder={fallbackTitle}
              maxLength={200}
              aria-invalid={fieldState.invalid || undefined}
            />
            <FieldDescription>
              Leer: der Titel der Seite. Bis etwa 60 Zeichen werden ganz angezeigt (
              {(field.value ?? "").length}).
            </FieldDescription>
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </Field>
        )}
      />
      <Controller
        control={control}
        name={"meta.description" as Path<T>}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="seo-description">Beschreibung</FieldLabel>
            <Textarea
              id="seo-description"
              {...field}
              value={field.value ?? ""}
              rows={3}
              maxLength={500}
              aria-invalid={fieldState.invalid || undefined}
            />
            <FieldDescription>
              Leer: der Einleitungstext oder der erste Absatz. Bis etwa 160 Zeichen (
              {(field.value ?? "").length}).
            </FieldDescription>
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </Field>
        )}
      />
      <Controller
        control={control}
        name={"meta.imageId" as Path<T>}
        render={({ field }) => (
          <Field>
            <FieldLabel>Bild beim Teilen</FieldLabel>
            <MediaPicker media={media} value={field.value} onChange={field.onChange} label="Bild" />
            <FieldDescription>
              Leer: das gezeichnete Vorschaubild mit dem Seitentitel.
            </FieldDescription>
          </Field>
        )}
      />
    </FieldGroup>
  );
}
