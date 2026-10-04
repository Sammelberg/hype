"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { MediaDoc } from "@/cms/content/types";
import { FigurSchema, slugAus, type FigurInput } from "@/buchung/logik/schemas";
import { FIGUR_KATEGORIEN, KATEGORIE_NAMEN, SPRACH_NAMEN, SPRACHEN } from "@/buchung/logik/typen";
import { loescheFigurAction, speichereFigurAction } from "../../../../_actions/buchung";
import { AuswahlFeld, SchalterFeld, ZahlFeld } from "../../../../_components/buero/felder";
import { FotoFeld, HakenFeld, ZeilenFeld } from "../../../../_components/buchung/felder";
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
  { id: "figur", title: "Figur" },
  { id: "fuer-wen", title: "Für wen" },
  { id: "programm", title: "Programm" },
  { id: "fotos", title: "Fotos" },
  { id: "sichtbar", title: "Sichtbarkeit" },
  { id: "seo", title: "Suchmaschinen" },
];
const SECTION_OF: Record<string, string> = {
  name: "figur",
  slug: "figur",
  kategorie: "figur",
  kurz: "figur",
  alterVon: "fuer-wen",
  alterBis: "fuer-wen",
  sprachen: "fuer-wen",
  programm: "programm",
  beschreibung: "programm",
  fotos: "fotos",
  aktiv: "sichtbar",
  sort: "sichtbar",
  metaTitle: "seo",
  metaDescription: "seo",
};

const LEER: FigurInput = {
  slug: "",
  name: "",
  kategorie: "prinzessinnen",
  alterVon: 3,
  alterBis: 8,
  sprachen: ["de"],
  kurz: null,
  beschreibung: null,
  programm: [],
  aktiv: true,
  sort: 0,
  fotos: [],
  metaTitle: null,
  metaDescription: null,
};

// A character as the catalogue shows it: a descriptive name of our own (never a licensed one),
// for which ages and in which languages, what happens at the party, real photos.
export function FigurEditor({
  id,
  figur,
  media,
}: {
  id: number | null;
  figur: FigurInput | null;
  media: MediaDoc[];
}) {
  const { busy, speichern, loeschen } = useSpeichern("/admin/buchung/figuren");
  const form = useForm({
    resolver: zodResolver(FigurSchema),
    defaultValues: figur ?? LEER,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, setError, setValue, getValues } = form;

  const absenden = handleSubmit((input) =>
    speichern(() => speichereFigurAction({ id, input }), {
      neuHref: id ? undefined : (d) => `/admin/buchung/figuren/${d.id}`,
      feldFehler: (feld, message) => setError(feld as keyof FigurInput, { message }),
      gespeichert: () => reset(input),
    }),
  );

  const invalid = [...new Set(Object.keys(formState.errors).map((k) => SECTION_OF[k] ?? "figur"))];

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={absenden} noValidate>
        <EditorShell
          backHref="/admin/buchung/figuren"
          backLabel="Figuren"
          title={id ? (figur?.name ?? "Figur") : "Neue Figur"}
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          onDelete={
            id ? () => loeschen(() => loescheFigurAction({ id }), "Figur gelöscht.") : undefined
          }
          deleteLabel="Figur löschen"
          deleteDescription="Nur für Figuren ohne Buchungen; alle anderen deaktivieren Sie unter „Sichtbarkeit“."
          actions={
            <Button type="submit" size="sm" disabled={busy || (Boolean(id) && !formState.isDirty)}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              {id ? "Speichern" : "Figur anlegen"}
            </Button>
          }
        >
          <SectionCard
            section={SECTIONS[0]!}
            description="Ein beschreibender Name, nie der einer Film- oder Spielfigur: Markennamen bringen Abmahnungen."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField control={control} name="name" label="Name" maxLength={200} />
              <TextField
                control={control}
                name="slug"
                label="Adresse"
                description="/figuren/… — Kleinbuchstaben und Bindestriche."
                maxLength={120}
              />
            </div>
            <AuswahlFeld
              control={control}
              name="kategorie"
              label="Kategorie"
              optionen={FIGUR_KATEGORIEN.map((k) => ({ value: k, label: KATEGORIE_NAMEN[k] }))}
            />
            <TextField
              control={control}
              name="kurz"
              label="Kurzbeschreibung"
              description="Ein Satz für die Karte im Katalog."
              maxLength={300}
            />
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
          </SectionCard>

          <SectionCard
            section={SECTIONS[1]!}
            description="Der Katalog filtert danach; die Sprachen stehen auf jeder Karte."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <ZahlFeld
                control={control}
                name="alterVon"
                label="Alter ab"
                einheit="Jahre"
                leerIstNull={false}
              />
              <ZahlFeld
                control={control}
                name="alterBis"
                label="Alter bis"
                einheit="Jahre"
                leerIstNull={false}
              />
            </div>
            <HakenFeld
              control={control}
              name="sprachen"
              label="Sprachen der Moderation"
              optionen={SPRACHEN.map((s) => ({ value: s, label: SPRACH_NAMEN[s] }))}
            />
          </SectionCard>

          <SectionCard
            section={SECTIONS[2]!}
            description="Was auf der Feier passiert: vier bis sechs Punkte, prüfbar statt blumig."
          >
            <ZeilenFeld control={control} name="programm" label="Programmpunkte" />
            <TextField
              control={control}
              name="beschreibung"
              label="Beschreibung"
              multiline
              rows={6}
              maxLength={5000}
            />
          </SectionCard>

          <SectionCard
            section={SECTIONS[3]!}
            description="Mindestens drei Fotos von echten Feiern, mit Einwilligung der Eltern. Das erste ist das Titelbild."
          >
            <FotoFeld control={control} name="fotos" media={media} />
          </SectionCard>

          <SectionCard
            section={SECTIONS[4]!}
            description="Eine deaktivierte Figur verschwindet aus Katalog und Buchung, ihre Buchungen bleiben."
          >
            <SchalterFeld
              control={control}
              name="aktiv"
              label="Buchbar"
              description="Aus, wenn das Kostüm in der Reparatur ist."
            />
            <ZahlFeld
              control={control}
              name="sort"
              label="Reihenfolge"
              description="Kleinere Zahlen stehen weiter vorn."
              leerIstNull={false}
            />
          </SectionCard>

          <SectionCard
            section={SECTIONS[5]!}
            description="Leer lassen, dann nimmt die Seite Name und Kurzbeschreibung."
          >
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
