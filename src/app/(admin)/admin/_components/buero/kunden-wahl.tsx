"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  CircleAlertIcon,
  ExternalLinkIcon,
  PlusIcon,
} from "lucide-react";
import { useId, useState } from "react";
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  useForm,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { KundeOption } from "@/buero/daten/kunden";
import { type KundeInput, KundeSchema } from "@/buero/logik/typen";
import { cn } from "@/lib/utils";
import { schnellKundeAction } from "../../_actions/buero";
import { TextField } from "../text-field";

const LEER: KundeInput = {
  art: "firma",
  firma: null,
  name: null,
  email: null,
  telefon: null,
  strasse: null,
  plz: null,
  ort: null,
  land: "DE",
  ustId: null,
  leitwegId: null,
  zahlungszielTage: null,
  ansprechpartner: [],
  notizen: null,
};

// The short form behind „Neuen Kunden anlegen“: what an invoice needs, nothing more. The rest
// waits on the customer card. Its own form: a submit here must not reach the document's form
// (React lets events bubble out of portals), hence stopPropagation.
function NeuerKundeDialog({
  offen,
  setOffen,
  vorschlag,
  onAngelegt,
}: {
  offen: boolean;
  setOffen: (offen: boolean) => void;
  vorschlag: string;
  onAngelegt: (kunde: KundeOption) => void;
}) {
  const [busy, setBusy] = useState(false);
  const form = useForm({
    resolver: zodResolver(KundeSchema),
    defaultValues: { ...LEER, firma: vorschlag || null },
  });
  const { control, handleSubmit, reset } = form;
  const art = useWatch({ control, name: "art" });
  const anlegen = handleSubmit(async (input) => {
    setBusy(true);
    const result = await schnellKundeAction(input);
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors || !result.data)
      return void toast.error("Bitte prüfen Sie die markierten Felder.");
    toast.success(`${result.data.name} angelegt (${result.data.nummer}).`);
    onAngelegt(result.data);
    reset(LEER);
    setOffen(false);
  });

  return (
    <Dialog open={offen} onOpenChange={setOffen}>
      <DialogContent className="sm:max-w-lg">
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.stopPropagation();
            void anlegen(e);
          }}
        >
          <DialogHeader>
            <DialogTitle>Neuer Kunde</DialogTitle>
            <DialogDescription>
              Was eine Rechnung braucht; alles Weitere ergänzen Sie später auf der Kundenkarte.
            </DialogDescription>
          </DialogHeader>
          <Controller
            control={control}
            name="art"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                variant="outline"
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
                aria-label="Art des Kunden"
                className="self-start"
              >
                <ToggleGroupItem value="firma">Firma</ToggleGroupItem>
                <ToggleGroupItem value="privat">Privatperson</ToggleGroupItem>
              </ToggleGroup>
            )}
          />
          <div className="grid gap-4">
            {art === "firma" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={control} name="firma" label="Firmenname" />
                <TextField control={control} name="name" label="Ansprechpartner" />
              </div>
            ) : (
              <TextField control={control} name="name" label="Name" />
            )}
            <TextField
              control={control}
              name="email"
              label="E-Mail"
              description="Auch die Adresse der E-Rechnung."
            />
            <TextField control={control} name="strasse" label="Straße und Hausnummer" />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)]">
              <TextField control={control} name="plz" label="PLZ" />
              <TextField control={control} name="ort" label="Ort" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Kunde anlegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Choosing the customer of an order, contract or invoice: search by name, number or town, or
// create one on the spot. Below it, the customer as the document will address them, with what
// is missing for an invoice.
export function KundenWahl<T extends FieldValues>({
  control,
  name,
  kunden,
  onNeu,
  onWahl,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forms whose schema transforms have another output type
  control: Control<T, any, any>;
  name: Path<T>;
  kunden: KundeOption[];
  /** A customer created here; the parent adds them to its list. */
  onNeu: (kunde: KundeOption) => void;
  /** After a choice, so the document can follow (its order, its payment terms). */
  onWahl?: (kunde: KundeOption | null) => void;
}) {
  const [offen, setOffen] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [suche, setSuche] = useState("");
  const listId = useId();
  const triggerId = useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const gewaehlt = kunden.find((k) => k.id === field.value) ?? null;
        const e = gewaehlt?.empfaenger;
        const fehlt = [
          !e?.strasse || !e?.plz || !e?.ort ? "Anschrift" : null,
          !e?.email ? "E-Mail für die E-Rechnung" : null,
        ].filter(Boolean);
        const waehle = (k: KundeOption | null) => {
          field.onChange(k?.id ?? null);
          onWahl?.(k);
        };
        return (
          <div className="flex flex-col gap-3">
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={triggerId}>Kunde</FieldLabel>
              <Popover open={offen} onOpenChange={setOffen}>
                <PopoverTrigger asChild>
                  <Button
                    id={triggerId}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={offen}
                    aria-controls={listId}
                    aria-invalid={fieldState.invalid || undefined}
                    className="w-full justify-between font-normal"
                  >
                    <span className={cn("truncate", !gewaehlt && "text-muted-foreground")}>
                      {gewaehlt
                        ? `${gewaehlt.name} (${gewaehlt.nummer})`
                        : "Kunde wählen oder anlegen"}
                    </span>
                    <ChevronsUpDownIcon aria-hidden="true" className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Name, Kundennummer oder Ort"
                      value={suche}
                      onValueChange={setSuche}
                    />
                    <CommandList id={listId}>
                      <CommandEmpty>Kein Kunde passt.</CommandEmpty>
                      {kunden.length > 0 ? (
                        <CommandGroup heading="Kunden">
                          {kunden.map((k) => (
                            <CommandItem
                              key={k.id}
                              value={`${k.name} ${k.nummer} ${k.ort ?? ""}`}
                              onSelect={() => {
                                waehle(k);
                                setOffen(false);
                              }}
                            >
                              <CheckIcon
                                aria-hidden="true"
                                className={cn(k.id === field.value ? "opacity-100" : "opacity-0")}
                              />
                              <span className="truncate">{k.name}</span>
                              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                {[k.ort, k.nummer].filter(Boolean).join(", ")}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ) : null}
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          value={`__neu ${suche}`}
                          onSelect={() => {
                            setOffen(false);
                            setDialog(true);
                          }}
                        >
                          <PlusIcon aria-hidden="true" />
                          {suche ? `„${suche}“ als neuen Kunden anlegen` : "Neuen Kunden anlegen"}
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
            </Field>

            {gewaehlt && e ? (
              <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
                <address className="min-w-0 not-italic">
                  <p className="font-medium">{e.name}</p>
                  {e.strasse ? <p>{e.strasse}</p> : null}
                  {e.plz || e.ort ? <p>{[e.plz, e.ort].filter(Boolean).join(" ")}</p> : null}
                  {e.email ? <p className="text-muted-foreground">{e.email}</p> : null}
                  {fehlt.length > 0 ? (
                    <p className="text-warning mt-1 flex items-center gap-1.5">
                      <CircleAlertIcon aria-hidden="true" className="size-3.5" />
                      Es fehlt: {fehlt.join(", ")}
                    </p>
                  ) : null}
                </address>
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                  <a
                    href={`/admin/kunden/${gewaehlt.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Kundenkarte <ExternalLinkIcon data-icon="inline-end" />
                  </a>
                </Button>
              </div>
            ) : null}

            <NeuerKundeDialog
              key={dialog ? `offen-${suche}` : "zu"}
              offen={dialog}
              setOffen={setDialog}
              vorschlag={suche}
              onAngelegt={(k) => {
                onNeu(k);
                waehle(k);
                setSuche("");
              }}
            />
          </div>
        );
      }}
    />
  );
}
