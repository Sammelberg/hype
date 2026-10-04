"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DarstellerSchema, type DarstellerInput } from "@/buchung/logik/schemas";
import { loescheDarstellerAction, speichereDarstellerAction } from "../../../../_actions/buchung";
import { SchalterFeld, ZahlFeld } from "../../../../_components/buero/felder";
import { HakenFeld } from "../../../../_components/buchung/felder";
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
  { id: "person", title: "Person" },
  { id: "rollen", title: "Spielt" },
  { id: "einsatz", title: "Einsatz" },
];
const SECTION_OF: Record<string, string> = {
  name: "person",
  email: "person",
  telefon: "person",
  notiz: "person",
  figuren: "rollen",
  aktiv: "einsatz",
  prioritaet: "einsatz",
};

const LEER: DarstellerInput = {
  name: "",
  email: null,
  telefon: null,
  aktiv: true,
  prioritaet: 100,
  notiz: null,
  figuren: [],
};

// A person who is sent to parties: whom they can play decides which slots the website sells.
export function DarstellerEditor({
  id,
  darsteller,
  figuren,
}: {
  id: number | null;
  darsteller: DarstellerInput | null;
  figuren: { id: number; name: string }[];
}) {
  const { busy, speichern, loeschen } = useSpeichern("/admin/buchung/darsteller");
  const form = useForm({
    resolver: zodResolver(DarstellerSchema),
    defaultValues: darsteller ?? LEER,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, setError } = form;

  const absenden = handleSubmit((input) =>
    speichern(() => speichereDarstellerAction({ id, input }), {
      neuHref: id ? undefined : (d) => `/admin/buchung/darsteller/${d.id}`,
      feldFehler: (feld, message) => setError(feld as keyof DarstellerInput, { message }),
      gespeichert: () => reset(input),
    }),
  );

  const invalid = [...new Set(Object.keys(formState.errors).map((k) => SECTION_OF[k] ?? "person"))];

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={absenden} noValidate>
        <EditorShell
          backHref="/admin/buchung/darsteller"
          backLabel="Darsteller"
          title={id ? (darsteller?.name ?? "Darsteller") : "Neuer Darsteller"}
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          onDelete={
            id
              ? () => loeschen(() => loescheDarstellerAction({ id }), "Darsteller gelöscht.")
              : undefined
          }
          deleteLabel="Darsteller löschen"
          deleteDescription="Nur ohne Einsätze und Sperren; alle anderen nehmen Sie unter „Einsatz“ aus der Planung."
          actions={
            <Button type="submit" size="sm" disabled={busy || (Boolean(id) && !formState.isDirty)}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              {id ? "Speichern" : "Darsteller anlegen"}
            </Button>
          }
        >
          <SectionCard
            section={SECTIONS[0]!}
            description="Name und Telefon stehen 24 Stunden vor der Feier in der Erinnerung an die Kundin."
          >
            <TextField control={control} name="name" label="Name" maxLength={200} />
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField control={control} name="email" label="E-Mail" maxLength={320} />
              <TextField control={control} name="telefon" label="Telefon" maxLength={40} />
            </div>
            <TextField
              control={control}
              name="notiz"
              label="Notiz"
              description="Nur intern: Führerschein, Sprachen, Schwerpunkte."
              multiline
              maxLength={5000}
            />
          </SectionCard>

          <SectionCard
            section={SECTIONS[1]!}
            description="Eine Figur ist zu einer Zeit frei, wenn mindestens einer, der sie spielt, frei ist."
          >
            {figuren.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Figuren angelegt — erst unter „Figuren“ anlegen, dann hier zuordnen.
              </p>
            ) : (
              <HakenFeld
                control={control}
                name="figuren"
                label="Figuren"
                optionen={figuren.map((f) => ({ value: f.id, label: f.name }))}
              />
            )}
          </SectionCard>

          <SectionCard
            section={SECTIONS[2]!}
            description="Sind mehrere frei, geht der Auftrag an die kleinere Zahl, bei Gleichstand an den mit weniger Einsätzen in der Woche."
          >
            <SchalterFeld
              control={control}
              name="aktiv"
              label="Wird eingeplant"
              description="Aus, wenn die Person nicht mehr für Hype Agency arbeitet. Einzelne freie Tage tragen Sie im Kalender als Sperre ein."
            />
            <ZahlFeld
              control={control}
              name="prioritaet"
              label="Reihenfolge bei der Einteilung"
              leerIstNull={false}
            />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
