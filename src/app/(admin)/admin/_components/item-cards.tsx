"use client";

import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import {
  type ArrayPath,
  type Control,
  type FieldArray,
  type FieldValues,
  useFieldArray,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A list of like items (steps, questions, services, words) as small cards: in a grid when the
// items are short, folded to one line each when they are long (`summary`), so a list never
// turns into a long column of fields. Order is the order on the site. `keyName` keeps our own
// `id` untouched.
export function ItemCards<T extends FieldValues, N extends ArrayPath<T>>({
  control,
  name,
  itemLabel,
  addLabel,
  make,
  render,
  summary,
  columns = 1,
  min = 0,
  max,
  fixed = false,
  anfangsOffen,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms ("" → null) have another output type
  control: Control<T, any, any>;
  name: N;
  /** What one item is called, for buttons: „Schritt 2“. */
  itemLabel: (index: number) => string;
  addLabel?: string;
  make?: () => FieldArray<T, N>;
  render: (index: number) => ReactNode;
  /** One line that stands for a folded item; without it every item stays open. */
  summary?: (index: number) => ReactNode;
  columns?: 1 | 2 | 3;
  min?: number;
  max?: number;
  fixed?: boolean;
  /** Which of the items present at the start come open (default: all folded). */
  anfangsOffen?: (index: number) => boolean;
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name, keyName: "key" });
  // Field keys are random per render pass; ids that reach the HTML come from useId instead.
  const baseId = useId();
  // Items present at the start come folded (unless `anfangsOffen`), items added here open; a
  // click flips either.
  const [initial] = useState(
    () => new Set(fields.filter((_, i) => !anfangsOffen?.(i)).map((field) => field.key)),
  );
  const [toggled, setToggled] = useState<Set<string>>(() => new Set());
  const toggle = (key: string) =>
    setToggled((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="@container flex flex-col gap-3">
      <ul
        role="list"
        className={cn(
          "grid gap-3",
          columns === 2 && "@xl:grid-cols-2",
          columns === 3 && "@xl:grid-cols-2 @4xl:grid-cols-3",
        )}
      >
        {fields.map((field, index) => {
          const label = itemLabel(index);
          const folded = summary ? initial.has(field.key) !== toggled.has(field.key) : false;
          const bodyId = `${baseId}-${index}`;
          return (
            <li
              key={field.key}
              className="flex flex-col overflow-hidden rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-1 py-1.5 pr-1.5 pl-3">
                {summary ? (
                  <button
                    type="button"
                    aria-expanded={!folded}
                    aria-controls={bodyId}
                    onClick={() => toggle(field.key)}
                    className="-ml-1.5 flex min-h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronDownIcon
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        folded && "-rotate-90",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{summary(index)}</span>
                  </button>
                ) : (
                  <span className="flex-1 text-xs font-medium text-muted-foreground">{label}</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${label} nach vorn`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ChevronUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${label} nach hinten`}
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
                    aria-label={`${label} entfernen`}
                    disabled={fields.length <= min}
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </div>
              <div id={bodyId} hidden={folded} className="border-t bg-card px-3 pt-3 pb-4">
                {render(index)}
              </div>
            </li>
          );
        })}
      </ul>
      {fixed || !make || (max !== undefined && fields.length >= max) ? null : (
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
    </div>
  );
}
