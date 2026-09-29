"use client";

import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { ReactNode } from "react";
import {
  type ArrayPath,
  type Control,
  type FieldArray,
  type FieldValues,
  useFieldArray,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldLegend, FieldSet } from "@/components/ui/field";

// A list of like items (steps, FAQ, words): each a card with up/down and remove, one button
// to add. Order is the order on the site. `keyName` keeps our own `id` untouched.
export function ListFields<T extends FieldValues, N extends ArrayPath<T>>({
  control,
  name,
  legend,
  description,
  addLabel,
  make,
  render,
  min = 0,
  max,
  fixed = false,
}: {
  control: Control<T>;
  name: N;
  legend: string;
  description?: string;
  addLabel: string;
  make: () => FieldArray<T, N>;
  render: (index: number) => ReactNode;
  min?: number;
  max?: number;
  fixed?: boolean;
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name, keyName: "key" });
  return (
    <FieldSet>
      <FieldLegend>{legend}</FieldLegend>
      {description ? <p className="-mt-2 text-sm text-muted-foreground">{description}</p> : null}
      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <Card
            key={field.key}
            size="sm"
            className="rise-in"
            style={{ "--rise-index": index } as React.CSSProperties}
          >
            <CardContent className="flex gap-3">
              <div className="min-w-0 flex-1">{render(index)}</div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Nach oben"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ChevronUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Nach unten"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ChevronDownIcon />
                </Button>
                {fixed ? null : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Entfernen"
                    disabled={fields.length <= min}
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {fixed || (max !== undefined && fields.length >= max) ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => append(make())}
        >
          <PlusIcon data-icon="inline-start" /> {addLabel}
        </Button>
      )}
    </FieldSet>
  );
}
