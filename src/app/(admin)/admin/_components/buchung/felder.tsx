"use client";

import { ArrowLeftIcon, ArrowRightIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MediaDoc } from "@/cms/content/types";
import { MediaPicker } from "../media-picker";

// The booking master data's own fields beside TextField and the office's: a list as lines, a
// group of checkboxes, an ordered set of photos. Each keeps its label, hint and error together.
const feldId = (name: string) => `feld-${name.replace(/\W+/g, "-")}`;

/** A list of short items, one per line (programme, what a package includes). */
export function ZeilenFeld<T extends FieldValues>({
  control,
  name,
  label,
  description,
  rows = 5,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms have another output type
  control: Control<T, any, any>;
  name: Path<T>;
  label: string;
  description?: string;
  rows?: number;
}) {
  const id = feldId(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Textarea
            id={id}
            rows={rows}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={((field.value as string[] | undefined) ?? []).join("\n")}
            onChange={(e) => field.onChange(e.target.value.split("\n"))}
            aria-invalid={fieldState.invalid || undefined}
          />
          <FieldDescription>{description ?? "Ein Punkt pro Zeile."}</FieldDescription>
          {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
        </Field>
      )}
    />
  );
}

/** Several of a fixed set of choices (languages, the Figuren a Darsteller plays). */
export function HakenFeld<T extends FieldValues, V extends string | number>({
  control,
  name,
  label,
  optionen,
  description,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms have another output type
  control: Control<T, any, any>;
  name: Path<T>;
  label: string;
  optionen: { value: V; label: string }[];
  description?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const gewaehlt = (field.value as V[] | undefined) ?? [];
        return (
          <FieldSet data-invalid={fieldState.invalid || undefined}>
            <FieldLegend variant="label">{label}</FieldLegend>
            {description ? <FieldDescription>{description}</FieldDescription> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {optionen.map((o) => {
                const id = `${feldId(name)}-${o.value}`;
                return (
                  <Field key={o.value} orientation="horizontal">
                    <Checkbox
                      id={id}
                      checked={gewaehlt.includes(o.value)}
                      onCheckedChange={(an) =>
                        field.onChange(
                          an ? [...gewaehlt, o.value] : gewaehlt.filter((v) => v !== o.value),
                        )
                      }
                    />
                    <FieldLabel htmlFor={id} className="font-normal">
                      {o.label}
                    </FieldLabel>
                  </Field>
                );
              })}
            </div>
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </FieldSet>
        );
      }}
    />
  );
}

/** Photos from the library in display order; the first is the card's picture. */
export function FotoFeld<T extends FieldValues>({
  control,
  name,
  media,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms have another output type
  control: Control<T, any, any>;
  name: Path<T>;
  media: MediaDoc[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const ids = (field.value as number[] | undefined) ?? [];
        const setze = (neu: number[]) => field.onChange(neu);
        const tausche = (i: number, j: number) => {
          const neu = [...ids];
          [neu[i], neu[j]] = [neu[j]!, neu[i]!];
          setze(neu);
        };
        return (
          <div className="flex flex-col gap-4">
            {ids.length > 0 ? (
              <ul role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ids.map((id, i) => {
                  const bild = media.find((m) => m.id === id);
                  return (
                    <li key={id} className="flex flex-col gap-2">
                      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                        {bild ? (
                          <Image
                            src={bild.sizes.thumbnail?.url ?? bild.url}
                            alt={bild.alt}
                            fill
                            sizes="(min-width: 640px) 200px, 50vw"
                            className="object-cover"
                          />
                        ) : null}
                        {i === 0 ? (
                          <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">
                            Titelbild
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={i === 0}
                          onClick={() => tausche(i, i - 1)}
                          aria-label="Nach vorn"
                        >
                          <ArrowLeftIcon />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setze(ids.filter((x) => x !== id))}
                          aria-label={`Foto ${bild?.alt ?? id} entfernen`}
                        >
                          <XIcon />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={i === ids.length - 1}
                          onClick={() => tausche(i, i + 1)}
                          aria-label="Nach hinten"
                        >
                          <ArrowRightIcon />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <MediaPicker
              media={media.filter((m) => !ids.includes(m.id))}
              value={null}
              onChange={(id) => id && setze([...ids, id])}
              label="Foto"
            />
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </div>
        );
      }}
    />
  );
}

/** A German wall-clock time („14:30“), in five-minute steps. */
export function UhrzeitFeld<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms have another output type
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
            type="time"
            step={300}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={(field.value as string | null) ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            aria-invalid={fieldState.invalid || undefined}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
        </Field>
      )}
    />
  );
}
