"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ExtraSchema, slugAus, type ExtraInput } from "@/buchung/logik/schemas";
import { loescheExtraAction, speichereExtraAction } from "../../../../_actions/buchung";
import { SchalterFeld, ZahlFeld } from "../../../../_components/buero/felder";
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
  { id: "extra", title: "Extra" },
  { id: "regeln", title: "Preis und Regeln" },
  { id: "sichtbar", title: "Sichtbarkeit" },
];
const SECTION_OF: Record<string, string> = {
  name: "extra",
  slug: "extra",
  beschreibung: "extra",
  preis: "regeln",
  dauerDeltaMin: "regeln",
  vorlaufTage: "regeln",
  zusatzFigur: "regeln",
  nurAnfrage: "regeln",
  aktiv: "sichtbar",
  sort: "sichtbar",
};

const LEER: ExtraInput = {
  slug: "",
  name: "",
  beschreibung: null,
  preis: null,
  dauerDeltaMin: 0,
  vorlaufTage: 0,
  zusatzFigur: false,
  nurAnfrage: false,
  aktiv: true,
  sort: 0,
};

// Something added to a booking. Its lead time hides it when the party is too close; its extra
// minutes lengthen the visit and with it the performer's Fenster.
export function ExtraEditor({ id, extra }: { id: number | null; extra: ExtraInput | null }) {
  const { busy, speichern, loeschen } = useSpeichern("/admin/buchung/angebot");
  const form = useForm({
    resolver: zodResolver(ExtraSchema),
    defaultValues: extra ?? LEER,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, setError, setValue, getValues } = form;

  const absenden = handleSubmit((input) =>
    speichern(() => speichereExtraAction({ id, input }), {
      neuHref: id ? undefined : (d) => `/admin/buchung/extras/${d.id}`,
      feldFehler: (feld, message) => setError(feld as keyof ExtraInput, { message }),
      gespeichert: () => reset(input),
    }),
  );

  const invalid = [...new Set(Object.keys(formState.errors).map((k) => SECTION_OF[k] ?? "extra"))];

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={absenden} noValidate>
        <EditorShell
          backHref="/admin/buchung/angebot"
          backLabel="Pakete & Extras"
          title={id ? (extra?.name ?? "Extra") : "Neues Extra"}
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          onDelete={
            id ? () => loeschen(() => loescheExtraAction({ id }), "Extra gelöscht.") : undefined
          }
          deleteLabel="Extra löschen"
          deleteDescription="Nur für Extras, die nie gebucht wurden; alle anderen deaktivieren Sie."
          actions={
            <Button type="submit" size="sm" disabled={busy || (Boolean(id) && !formState.isDirty)}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              {id ? "Speichern" : "Extra anlegen"}
            </Button>
          }
        >
          <SectionCard section={SECTIONS[0]!}>
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
            description="Kerzen- und Blumenarrangements werden auf Bestellung gefertigt: mit Vorlauf, sonst bietet die Website sie nicht an."
          >
            <div className="grid gap-6 sm:grid-cols-3">
              <ZahlFeld control={control} name="preis" label="Preis" einheit="€" />
              <ZahlFeld
                control={control}
                name="dauerDeltaMin"
                label="Verlängert um"
                einheit="Minuten"
                leerIstNull={false}
              />
              <ZahlFeld
                control={control}
                name="vorlaufTage"
                label="Vorlauf"
                einheit="Tage"
                leerIstNull={false}
              />
            </div>
            <SchalterFeld
              control={control}
              name="zusatzFigur"
              label="Zweite Figur"
              description="Bringt einen zweiten Darsteller; nur buchbar, wenn einer frei ist."
            />
            <SchalterFeld
              control={control}
              name="nurAnfrage"
              label="Nur auf Anfrage"
              description="Etwa der Fotograf: macht aus der Buchung eine Anfrage."
            />
          </SectionCard>

          <SectionCard section={SECTIONS[2]!}>
            <SchalterFeld control={control} name="aktiv" label="Buchbar" />
            <ZahlFeld control={control} name="sort" label="Reihenfolge" leerIstNull={false} />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
