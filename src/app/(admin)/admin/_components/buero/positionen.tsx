"use client";

import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

import { Field, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { euro, positionNetto } from "@/buero/logik/geld";
import { EINHEITEN, type Position } from "@/buero/logik/typen";
import { ItemCards } from "../item-cards";
import { TextField } from "../text-field";
import { AuswahlFeld, ZahlFeld } from "./felder";

export const neuePositionsId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

export type PositionBetrag = Omit<Position, "id" | "ustSatz"> & { ustSatz: number };

/** The positions as the form holds them right now, numbers coerced: for totals and previews. */
export const positionenAusWerten = (werte: Partial<Position>[] | undefined): PositionBetrag[] =>
  (werte ?? []).map((p) => ({
    bezeichnung: p?.bezeichnung ?? "",
    menge: Number(p?.menge ?? 0),
    einheit: p?.einheit ?? "HUR",
    einzelpreis: Number(p?.einzelpreis ?? 0),
    ustSatz: Number(p?.ustSatz ?? 19),
  }));

// The lines of an invoice or an offer: what, how much, at which price and rate. Short documents
// show their lines open, long ones folded to a line with the amount.
export function PositionenListe<T extends FieldValues>({
  control,
  positionen,
  anfang,
  kleinunternehmer,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms ("" → null) have another output type
  control: Control<T, any, any>;
  /** The current lines (positionenAusWerten). */
  positionen: PositionBetrag[];
  /** The lines the document opened with. */
  anfang: Position[];
  kleinunternehmer: boolean;
}) {
  const feld = (i: number, name: keyof Position) => `positionen.${i}.${name}` as Path<T>;
  return (
    <ItemCards
      control={control}
      name={"positionen" as never}
      itemLabel={(i) => positionen[i]?.bezeichnung || `Position ${i + 1}`}
      addLabel="Position hinzufügen"
      min={1}
      anfangsOffen={(i) => anfang.length <= 3 || !anfang[i]?.bezeichnung}
      summary={(i) => (
        <span className="flex min-w-0 items-baseline justify-between gap-3">
          <span className="truncate font-medium">
            {positionen[i]?.bezeichnung || "Neue Position"}
          </span>
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {positionen[i] ? euro(positionNetto(positionen[i])) : ""}
          </span>
        </span>
      )}
      make={
        (() => ({
          id: neuePositionsId(),
          bezeichnung: "",
          menge: 1,
          einheit: "HUR" as const,
          einzelpreis: 0,
          ustSatz: 19 as const,
        })) as never
      }
      render={(i) => (
        <div className="grid gap-3">
          <TextField
            control={control}
            name={feld(i, "bezeichnung")}
            label="Leistung"
            multiline
            rows={2}
          />
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
            <ZahlFeld control={control} name={feld(i, "menge")} label="Menge" leerIstNull={false} />
            <AuswahlFeld
              control={control}
              name={feld(i, "einheit")}
              label="Einheit"
              optionen={Object.entries(EINHEITEN).map(([value, label]) => ({ value, label }))}
            />
            <ZahlFeld
              control={control}
              name={feld(i, "einzelpreis")}
              label="Einzelpreis netto"
              einheit="€"
              leerIstNull={false}
            />
          </div>
          {kleinunternehmer ? null : (
            <Controller
              control={control}
              name={feld(i, "ustSatz")}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Umsatzsteuer</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={String(field.value)}
                    onValueChange={(v) => v && field.onChange(Number(v))}
                    aria-label="Umsatzsteuersatz"
                    className="self-start"
                  >
                    <ToggleGroupItem value="19">19 %</ToggleGroupItem>
                    <ToggleGroupItem value="7">7 %</ToggleGroupItem>
                  </ToggleGroup>
                </Field>
              )}
            />
          )}
        </div>
      )}
    />
  );
}
