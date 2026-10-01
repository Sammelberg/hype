"use client";

import { Controller } from "react-hook-form";

import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SectionsOf } from "@/cms/content/page-sections";
import { ItemCards } from "../../../_components/item-cards";
import { SectionCard } from "../../../_components/sections";
import { TextField } from "../../../_components/text-field";
import { type EditorContext, kindControl, newId } from "./editor-context";

// A service's own page (every page right under /leistungen): the cards in the order the page
// shows them, each outlining its part of the preview.
export const LEISTUNG_SECTIONS = [
  { id: "kopf", title: "Kopfbereich", zone: "kopf" },
  { id: "text", title: "Einleitung", zone: "text" },
  { id: "passt", title: "Wann das passt", zone: "passt" },
  { id: "umfang", title: "Was Sie bekommen", zone: "umfang" },
  { id: "vorgehen", title: "Vorgehen", zone: "vorgehen" },
  { id: "fragen", title: "Häufige Fragen", zone: "fragen" },
  { id: "projekt", title: "Passendes Projekt", zone: "projekt" },
  { id: "anfrage", title: "Abschluss „Anfrage“", zone: "anfrage" },
  { id: "suchmaschinen", title: "Suchmaschinen und Teilen" },
  { id: "adresse", title: "Adresse und Ordnung" },
];

const NONE = "__kein";

const untitled = (text: string | null | undefined, fallback: string) =>
  text?.trim() ? text : <span className="text-muted-foreground">{fallback}</span>;

// Which card holds a field of these sections, for the marks in the index.
export function leistungSectionOf(path: string): string | null {
  if (/^sections\.fit/.test(path)) return "passt";
  if (/^sections\.scope/.test(path)) return "umfang";
  if (/^sections\.steps/.test(path)) return "vorgehen";
  if (/^sections\.faq/.test(path)) return "fragen";
  if (path === "sections.projektId") return "projekt";
  return null;
}

export function LeistungSections({ ctx }: { ctx: EditorContext }) {
  const control = kindControl<"leistung">(ctx.control);
  const sections = ctx.values.sections as Partial<SectionsOf<"leistung">> | undefined;
  const published = ctx.projekte.filter((p) => p.status === "published");
  return (
    <>
      <SectionCard
        section={LEISTUNG_SECTIONS[2]!}
        description="Situationen, in denen sich die Leistung lohnt: ein kurzer Titel, zwei, drei Sätze. Auf der Seite als Kacheln nebeneinander."
      >
        <TextField control={control} name="sections.fitTitle" label="Überschrift" />
        <ItemCards
          control={control}
          name="sections.fit"
          itemLabel={(i) => sections?.fit?.[i]?.title || `Situation ${i + 1}`}
          addLabel="Situation hinzufügen"
          columns={3}
          summary={(i) => untitled(sections?.fit?.[i]?.title, "Neue Situation")}
          make={() => ({ id: newId(), title: "", text: "" })}
          render={(i) => (
            <div className="grid gap-3">
              <TextField control={control} name={`sections.fit.${i}.title`} label="Titel" />
              <TextField
                control={control}
                name={`sections.fit.${i}.text`}
                label="Text"
                multiline
                rows={3}
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard
        section={LEISTUNG_SECTIONS[3]!}
        description="Was zur Leistung gehört, Punkt für Punkt. Auf der Seite als Liste in zwei Spalten."
      >
        <TextField control={control} name="sections.scopeTitle" label="Überschrift" />
        <FieldSet>
          <FieldLegend variant="label">Punkte</FieldLegend>
          <ItemCards
            control={control}
            name="sections.scope"
            itemLabel={(i) => `Punkt ${i + 1}`}
            addLabel="Punkt hinzufügen"
            columns={2}
            make={() => ({ id: newId(), text: "" })}
            render={(i) => (
              <TextField
                control={control}
                name={`sections.scope.${i}.text`}
                label={`Punkt ${i + 1}`}
                hideLabel
              />
            )}
          />
        </FieldSet>
      </SectionCard>

      <SectionCard
        section={LEISTUNG_SECTIONS[4]!}
        description="Wie ein Vorhaben dieser Art abläuft, in der Reihenfolge der Schritte. Die Nummern setzt die Seite."
      >
        <TextField control={control} name="sections.stepsTitle" label="Überschrift" />
        <ItemCards
          control={control}
          name="sections.steps"
          itemLabel={(i) => sections?.steps?.[i]?.title || `Schritt ${i + 1}`}
          addLabel="Schritt hinzufügen"
          summary={(i) => untitled(sections?.steps?.[i]?.title, "Neuer Schritt")}
          make={() => ({ id: newId(), title: "", text: "" })}
          render={(i) => (
            <div className="grid gap-3">
              <TextField control={control} name={`sections.steps.${i}.title`} label="Titel" />
              <TextField
                control={control}
                name={`sections.steps.${i}.text`}
                label="Text"
                multiline
                rows={3}
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard
        section={LEISTUNG_SECTIONS[5]!}
        description="Fragen, die Interessenten zu genau dieser Leistung stellen. Suchmaschinen lesen sie als FAQ mit."
      >
        <TextField control={control} name="sections.faqTitle" label="Überschrift" />
        <ItemCards
          control={control}
          name="sections.faq"
          itemLabel={(i) => `Frage ${i + 1}`}
          addLabel="Frage hinzufügen"
          summary={(i) => untitled(sections?.faq?.[i]?.question, "Neue Frage")}
          make={() => ({ id: newId(), question: "", answer: "" })}
          render={(i) => (
            <div className="grid gap-3">
              <TextField control={control} name={`sections.faq.${i}.question`} label="Frage" />
              <TextField
                control={control}
                name={`sections.faq.${i}.answer`}
                label="Antwort"
                multiline
                rows={4}
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard
        section={LEISTUNG_SECTIONS[6]!}
        description="Ein veröffentlichtes Projekt, das die Leistung zeigt. Ohne Projekt entfällt der Abschnitt."
      >
        <Controller
          control={control}
          name="sections.projektId"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="leistung-projekt">Projekt</FieldLabel>
              <Select
                value={field.value ? String(field.value) : NONE}
                onValueChange={(value) => field.onChange(value === NONE ? null : Number(value))}
              >
                <SelectTrigger id="leistung-projekt" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Kein Projekt</SelectItem>
                  {published.map((projekt) => (
                    <SelectItem key={projekt.id} value={String(projekt.id)}>
                      {projekt.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {published.length === 0 ? (
                <FieldDescription>Noch kein Projekt veröffentlicht.</FieldDescription>
              ) : null}
            </Field>
          )}
        />
      </SectionCard>
    </>
  );
}
