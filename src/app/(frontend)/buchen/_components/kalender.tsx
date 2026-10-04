"use client";

import { cn } from "@/lib/utils";

import { tagNummer, tagText, wochentag, zeitraumText } from "../_lib/kalender";

const KOPF = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// The booking calendar: six weeks as a grid of days. A day with a free start is a button marked
// „frei“ in Zitrone (colour always with the word, for screen readers in the label); a day without
// one is shown but cannot be chosen. Under it the free starts of the chosen day as radios.
export function Kalender({
  tage,
  starts,
  laedt,
  tag,
  uhrzeit,
  onTag,
  onUhrzeit,
  onFrueher,
  onSpaeter,
  fehler,
}: {
  tage: string[];
  /** Free starts per day; undefined while loading. */
  starts: Record<string, string[]> | undefined;
  laedt: boolean;
  tag: string | null;
  uhrzeit: string | null;
  onTag: (tag: string) => void;
  onUhrzeit: (uhrzeit: string) => void;
  onFrueher: (() => void) | null;
  onSpaeter: (() => void) | null;
  fehler?: string;
}) {
  const zeiten = tag ? (starts?.[tag] ?? []) : [];
  const freieTage = tage.filter((t) => (starts?.[t]?.length ?? 0) > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium" aria-live="polite">
          {zeitraumText(tage)}
          {laedt ? <span className="sr-only">: freie Termine werden geladen</span> : null}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onFrueher ?? undefined}
            disabled={!onFrueher}
            className="min-h-11 rounded-full border px-4 text-sm disabled:opacity-40"
          >
            Früher
          </button>
          <button
            type="button"
            onClick={onSpaeter ?? undefined}
            disabled={!onSpaeter}
            className="min-h-11 rounded-full border px-4 text-sm disabled:opacity-40"
          >
            Später
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label="Tag der Feier"
        aria-busy={laedt}
        className={cn("mt-3 grid grid-cols-7 gap-1", laedt && "opacity-60")}
      >
        {KOPF.map((k) => (
          <span key={k} aria-hidden className="pb-1 text-center text-sm text-muted-foreground">
            {k}
          </span>
        ))}
        {tage.map((t) => {
          const frei = (starts?.[t]?.length ?? 0) > 0;
          const gewaehlt = t === tag;
          const samstag = wochentag(t) === 6;
          return (
            <button
              key={t}
              type="button"
              disabled={!frei}
              aria-pressed={gewaehlt}
              aria-label={`${tagText(t)}${frei ? ", frei" : ", nicht frei"}`}
              onClick={() => onTag(t)}
              className={cn(
                "flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl text-base tabular-nums",
                frei
                  ? "bg-highlight font-semibold text-highlight-foreground"
                  : "text-muted-foreground/60 line-through",
                samstag && frei && "ring-1 ring-foreground/30",
                gewaehlt && "bg-foreground text-background ring-0",
              )}
            >
              {tagNummer(t)}
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden className="size-4 rounded bg-highlight" /> frei
        {!laedt && starts ? (
          <span className="ml-2">
            {freieTage === 0 ? "In diesen Wochen ist nichts mehr frei." : null}
          </span>
        ) : null}
      </p>

      {tag ? (
        <fieldset className="mt-6">
          <legend className="text-sm font-medium">Beginn am {tagText(tag)}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {zeiten.map((z) => (
              <label
                key={z}
                className="cursor-pointer rounded-full border bg-card px-4 py-2.5 text-base tabular-nums has-checked:border-foreground has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-3 has-focus-visible:ring-ring"
              >
                <input
                  type="radio"
                  name="uhrzeit"
                  value={z}
                  checked={uhrzeit === z}
                  onChange={() => onUhrzeit(z)}
                  className="sr-only"
                />
                {z} Uhr
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {fehler ? (
        <p id="termin-fehler" className="mt-3 text-sm font-medium text-destructive">
          {fehler}
        </p>
      ) : null}
    </div>
  );
}
