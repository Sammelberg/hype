"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PaketSchema, slugAus, type PaketInput } from "@/buchung/logik/schemas";
import { loeschePaketAction, speicherePaketAction } from "../../../../_actions/buchung";
import { AuswahlFeld, SchalterFeld, ZahlFeld } from "../../../../_components/buero/felder";
import { ZeilenFeld } from "../../../../_components/buchung/felder";
import { useSpeichern } from "../../../../_components/buchung/speichern";
import { EditorShell } from "../../../../_components/editor-shell";
import {
  SectionCard,
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../../_components/sections";
import { TextField } from "../../../../_components/text-field";

const SECTIONS: SectionInfo[] = [
  { id: "paket", title: "Paket" },
  { id: "preis", title: "Dauer und Preis" },
  { id: "sichtbar", title: "Sichtbarkeit" },
];
const SECTION_OF: Record<string, string> = {
  name: "paket",
  slug: "paket",
  beschreibung: "paket",
  leistungen: "paket",
  dauerMin: "preis",
  preis: "preis",
  figurenAnzahl: "preis",
  nurAnfrage: "preis",
  aktiv: "sichtbar",
  sort: "sichtbar",
};

const LEER: PaketInput = {
  slug: "",
  name: "",
  beschreibung: null,
  leistungen: [],
  dauerMin: 90,
  preis: null,
  figurenAnzahl: 1,
  nurAnfrage: false,
  aktiv: true,
  sort: 0,
};

// How long and with what, independent of the Figur. The price is the end price in Zone A; travel
// to farther Zonen is added as its own line.
export function PaketEditor({ id, paket }: { id: number | null; paket: PaketInput | null }) {
  const { busy, speichern, loeschen } = useSpeichern("/admin/buchung/angebot");
  const form = useForm({
    resolver: zodResolver(PaketSchema),
    defaultValues: paket ?? LEER,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, setError, setValue, getValues } = form;

  const absenden = handleSubmit((input) =>
    speichern(() => speicherePaketAction({ id, input }), {
      neuHref: id ? undefined : (d) => `/admin/buchung/pakete/${d.id}`,
      feldFehler: (feld, message) => setError(feld as keyof PaketInput, { message }),
      gespeichert: () => reset(input),
    }),
  );

  const invalid = [...new Set(Object.keys(formState.errors).map((k) => SECTION_OF[k] ?? "paket"))];

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={absenden} noValidate>
        <EditorShell
          backHref="/admin/buchung/angebot"
          backLabel="Pakete & Extras"
          title={id ? (paket?.name ?? "Paket") : "Neues Paket"}
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          onDelete={
            id ? () => loeschen(() => loeschePaketAction({ id }), "Paket gelöscht.") : undefined
          }
          deleteLabel="Paket löschen"
          deleteDescription="Nur für Pakete, die nie gebucht wurden; alle anderen deaktivieren Sie."
          actions={
            <Button type="submit" size="sm" disabled={busy || (Boolean(id) && !formState.isDirty)}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              {id ? "Speichern" : "Paket anlegen"}
            </Button>
          }
        >
          <SectionCard section={SECTIONS[0]!} description="Was die Eltern bekommen, in Punkten.">
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField control={control} name="name" label="Name" maxLength={200} />
              <TextField control={control} name="slug" label="Kürzel" maxLength={120} />
            </div>
            {id ? null : (
              <Button
                type="button"
                variant="link"
                className="self-start px-0"
                onClick={() =>
                  setValue("slug", slugAus(getValues("name")), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                Kürzel aus dem Namen bilden
              </Button>
            )}
            <ZeilenFeld control={control} name="leistungen" label="Leistungen" />
            <TextField
              control={control}
              name="beschreibung"
              label="Beschreibung"
              multiline
              maxLength={5000}
            />
          </SectionCard>

          <SectionCard
            section={SECTIONS[1]!}
            description="Endpreis für Zone A. „Nur auf Anfrage“ (Kita, Events) braucht weder Dauer noch Preis."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <ZahlFeld control={control} name="dauerMin" label="Dauer" einheit="Minuten" />
              <ZahlFeld control={control} name="preis" label="Preis" einheit="€" />
            </div>
            <AuswahlFeld
              control={control}
              name="figurenAnzahl"
              label="Figuren"
              zahl
              optionen={[
                { value: "1", label: "Eine Figur" },
                { value: "2", label: "Zwei Figuren (zwei Darsteller)" },
              ]}
            />
            <SchalterFeld
              control={control}
              name="nurAnfrage"
              label="Nur auf Anfrage"
              description="Kein Termin auf der Website; die Eltern schicken eine Anfrage."
            />
          </SectionCard>

          <SectionCard section={SECTIONS[2]!}>
            <SchalterFeld control={control} name="aktiv" label="Buchbar" />
            <ZahlFeld
              control={control}
              name="sort"
              label="Reihenfolge"
              description="Kleinere Zahlen stehen weiter vorn."
              leerIstNull={false}
            />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
