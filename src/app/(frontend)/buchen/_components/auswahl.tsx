"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import type { BuchungsFigur } from "@/buchung/logik/buchen";
import { SPRACH_NAMEN } from "@/buchung/logik/typen";
import { cn } from "@/lib/utils";

// The booking form's choices as cards: a native radio or checkbox inside a label, so keyboard,
// screen readers and a tap anywhere on the card work as the platform does. Only the look is ours.

const KARTE =
  "relative flex cursor-pointer rounded-2xl border bg-card p-4 has-checked:border-foreground has-checked:ring-2 has-checked:ring-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-60";

export function WahlKarte({
  name,
  typ = "radio",
  checked,
  onChange,
  disabled,
  children,
  className,
}: {
  name: string;
  typ?: "radio" | "checkbox";
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn(KARTE, className)}>
      <input
        type={typ}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      {children}
    </label>
  );
}

/** A Figur to choose: picture or initial, name, ages, languages. */
export function FigurWahl({
  figur,
  name,
  checked,
  onChange,
  disabled,
}: {
  figur: BuchungsFigur;
  name: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <WahlKarte
      name={name}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="flex-col gap-3 p-2.5"
    >
      <span className="relative block aspect-square overflow-hidden rounded-xl bg-secondary">
        {figur.foto ? (
          <Image
            src={figur.foto.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 12rem, 45vw"
            className="object-cover"
            style={{ objectPosition: `${figur.foto.focalX}% ${figur.foto.focalY}%` }}
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center font-hand text-5xl font-semibold text-primary"
          >
            {figur.name.charAt(0)}
          </span>
        )}
      </span>
      <span className="px-1 pb-1">
        <span className="block font-hand text-lg leading-tight font-semibold">{figur.name}</span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {figur.alterVon} bis {figur.alterBis} Jahre
        </span>
        <span className="block text-sm text-muted-foreground">
          {figur.sprachen.map((s) => SPRACH_NAMEN[s]).join(", ")}
        </span>
      </span>
    </WahlKarte>
  );
}

/** A labelled text field with its error right under it. */
export function Feld({
  id,
  label,
  hinweis,
  fehler,
  children,
}: {
  id: string;
  label: string;
  hinweis?: string;
  fehler?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hinweis && !fehler ? (
        <p id={`${id}-hinweis`} className="text-sm text-muted-foreground">
          {hinweis}
        </p>
      ) : null}
      {fehler ? (
        <p id={`${id}-fehler`} className="text-sm font-medium text-destructive">
          {fehler}
        </p>
      ) : null}
    </div>
  );
}

export const EINGABE =
  "w-full rounded-lg border border-input bg-card px-4 py-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring aria-invalid:border-destructive";
