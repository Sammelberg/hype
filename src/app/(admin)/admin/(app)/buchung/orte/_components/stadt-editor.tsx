"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StadtSchema, slugAus, type StadtInput } from "@/buchung/logik/schemas";
import { loescheStadtAction, speichereStadtAction } from "../../../../_actions/buchung";
import { AuswahlFeld, SchalterFeld, ZahlFeld } from "../../../../_components/buero/felder";
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
  { id: "ort", title: "Ort" },
  { id: "seite", title: "Eigene Seite" },
  { id: "seo", title: "Suchmaschinen" },
];
const SECTION_OF: Record<string, string> = {
  name: "ort",
  slug: "ort",
  zoneCode: "ort",
  sort: "ort",
  seite: "seite",
  intro: "seite",
  bezirke: "seite",
  orte: "seite",
  bedingungen: "seite",
  metaTitle: "seo",
  metaDescription: "seo",
};

const LEER: StadtInput = {
  name: "",
  slug: "",
  zoneCode: "",
  seite: false,
  intro: null,
  bezirke: null,
  orte: null,
  bedingungen: null,
  metaTitle: null,
  metaDescription: null,
  sort: 0,
};

// A town in the booking form's list. With a text of its own it also gets a landing page at
// /kindergeburtstag/<adresse> — four real pages beat twelve that only swap the town's name.
export function StadtEditor({
  id,
  stadt,
  zonen,
}: {
  id: number | null;
  stadt: StadtInput | null;
  zonen: { code: string; name: string }[];
}) {
  const { busy, speichern, loeschen } = useSpeichern("/admin/buchung/gebiet");
  const form = useForm({
    resolver: zodResolver(StadtSchema),
    defaultValues: stadt ?? LEER,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, setError, setValue, getValues } = form;
  const seite = useWatch({ control, name: "seite" });

  const absenden = handleSubmit((input) =>
    speichern(() => speichereStadtAction({ id, input }), {
      neuHref: id ? undefined : (d) => `/admin/buchung/orte/${d.id}`,
      feldFehler: (feld, message) => setError(feld as keyof StadtInput, { message }),
      gespeichert: () => reset(input),
    }),
  );

  const invalid = [...new Set(Object.keys(formState.errors).map((k) => SECTION_OF[k] ?? "ort"))];

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={absenden} noValidate>
        <EditorShell
          backHref="/admin/buchung/gebiet"
          backLabel="Zonen & Orte"
          title={id ? (stadt?.name ?? "Ort") : "Neuer Ort"}
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          onDelete={
            id ? () => loeschen(() => loescheStadtAction({ id }), "Ort gelöscht.") : undefined
          }
          deleteLabel="Ort löschen"
          deleteDescription="Gebuchte Feiern behalten ihre Zone und Adresse."
          actions={
            <Button type="submit" size="sm" disabled={busy || (Boolean(id) && !formState.isDirty)}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              {id ? "Speichern" : "Ort anlegen"}
            </Button>
          }
        >
          <SectionCard
            section={SECTIONS[0]!}
            description="Die Eltern wählen den Ort aus einer Liste; die Zone bestimmt Aufschlag und Fahrzeit."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField control={control} name="name" label="Name" maxLength={120} />
              <TextField
                control={control}
                name="slug"
                label="Adresse"
                description="/kindergeburtstag/…"
                maxLength={120}
              />
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
                Adresse aus dem Namen bilden
              </Button>
            )}
            <AuswahlFeld
              control={control}
              name="zoneCode"
              label="Zone"
              optionen={zonen.map((z) => ({ value: z.code, label: `${z.code} — ${z.name}` }))}
            />
            <ZahlFeld control={control} name="sort" label="Reihenfolge" leerIstNull={false} />
          </SectionCard>

          <SectionCard
            section={SECTIONS[1]!}
            description="Nur mit eigenem Text: Stadtteile, beliebte Orte für Feiern, was bei der Anfahrt gilt."
          >
            <SchalterFeld
              control={control}
              name="seite"
              label="Eigene Seite"
              description="Erscheint im Menü der Orte und in der Sitemap."
            />
            {seite ? (
              <>
                <TextField
                  control={control}
                  name="intro"
                  label="Einleitung"
                  multiline
                  rows={4}
                  maxLength={5000}
                />
                <TextField
                  control={control}
                  name="bezirke"
                  label="Stadtteile und Umgebung"
                  multiline
                  maxLength={5000}
                />
                <TextField
                  control={control}
                  name="orte"
                  label="Beliebte Orte für Feiern"
                  multiline
                  maxLength={5000}
                />
                <TextField
                  control={control}
                  name="bedingungen"
                  label="Anfahrt und Bedingungen"
                  multiline
                  maxLength={5000}
                />
              </>
            ) : null}
          </SectionCard>

          <SectionCard section={SECTIONS[2]!} description="Leer lassen für den Standard.">
            <TextField control={control} name="metaTitle" label="Titel" maxLength={200} />
            <TextField
              control={control}
              name="metaDescription"
              label="Beschreibung"
              multiline
              maxLength={300}
            />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
