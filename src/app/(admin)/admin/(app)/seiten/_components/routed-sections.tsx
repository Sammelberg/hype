"use client";

import { ArrowUpRightIcon, CircleAlertIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Controller } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import type { SectionsOf } from "@/cms/content/page-sections";
import { CardLink, tileLinkSurface } from "../../../_components/card-link";
import { ItemCards } from "../../../_components/item-cards";
import { LexicalEditor } from "../../../_components/lexical-editor/editor";
import { SectionCard } from "../../../_components/sections";
import { StatusBadge } from "../../../_components/status-badge";
import { TextField } from "../../../_components/text-field";
import { ClosingSection, HeadSection, SeoSection } from "./common-sections";
import { type EditorContext, kindControl, newId } from "./editor-context";

const untitled = (text: string | null | undefined, fallback: string) =>
  text?.trim() ? text : <span className="text-muted-foreground">{fallback}</span>;

// ---------------------------------------------------------------------------------------------
// Startseite

export const HOME_SECTIONS = [
  { id: "kopf", title: "Kopfbereich", zone: "kopf" },
  { id: "vorgehen", title: "Vorgehen", zone: "vorgehen" },
  { id: "grundsaetze", title: "Grundsätze", zone: "grundsaetze" },
  { id: "fragen", title: "Häufige Fragen", zone: "fragen" },
  { id: "anfrage", title: "Abschluss „Anfrage“", zone: "anfrage" },
  { id: "suchmaschinen", title: "Suchmaschinen und Teilen" },
];

const homeSection = (id: string) => HOME_SECTIONS.find((s) => s.id === id)!;

export function HomeSections({ ctx }: { ctx: EditorContext }) {
  const control = kindControl<"home">(ctx.control);
  const sections = ctx.values.sections as Partial<SectionsOf<"home">> | undefined;
  return (
    <>
      <SectionCard
        section={homeSection("kopf")}
        description="Die große Überschrift oben auf der Startseite und die Zeile darunter."
      >
        <TextField control={control} name="sections.hero.headline" label="Überschrift" />
        <TextField control={control} name="sections.hero.lead" label="Zeile darunter" />
        <p className="text-sm text-muted-foreground">
          Die Schaltfläche darunter trägt die Beschriftung des Abschlusses „Anfrage“ (Website).
        </p>
      </SectionCard>

      <SectionCard
        section={homeSection("vorgehen")}
        description="Die Schritte unter „So arbeiten wir“, nummeriert in dieser Reihenfolge."
      >
        <TextField control={control} name="sections.stepsTitle" label="Überschrift" />
        <ItemCards
          control={control}
          name="sections.steps"
          itemLabel={(i) => `Schritt ${i + 1}`}
          addLabel="Schritt hinzufügen"
          columns={2}
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
        section={homeSection("grundsaetze")}
        description="Die Grundsätze, jeweils mit Titel und kurzem Text."
      >
        <TextField control={control} name="sections.principlesTitle" label="Überschrift" />
        <ItemCards
          control={control}
          name="sections.principles"
          itemLabel={(i) => `Grundsatz ${i + 1}`}
          addLabel="Grundsatz hinzufügen"
          columns={2}
          make={() => ({ id: newId(), title: "", text: "" })}
          render={(i) => (
            <div className="grid gap-3">
              <TextField control={control} name={`sections.principles.${i}.title`} label="Titel" />
              <TextField
                control={control}
                name={`sections.principles.${i}.text`}
                label="Text"
                multiline
                rows={3}
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard
        section={homeSection("fragen")}
        description="Eine Frage pro Karte; auf der Seite klappt ein Klick die Antwort auf. Suchmaschinen lesen sie als FAQ."
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

      <ClosingSection ctx={ctx} />
      <SeoSection ctx={ctx} />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Projekte

export const PROJEKTE_SECTIONS = [
  { id: "kopf", title: "Kopfbereich", zone: "kopf" },
  { id: "projekte", title: "Projekte", zone: "projekte" },
  { id: "anfrage", title: "Abschluss „Anfrage“", zone: "anfrage" },
  { id: "suchmaschinen", title: "Suchmaschinen und Teilen" },
];

export function ProjekteSections({ ctx }: { ctx: EditorContext }) {
  const control = kindControl<"projekte">(ctx.control);
  const published = ctx.projekte.filter((p) => p.status === "published");
  return (
    <>
      <HeadSection ctx={ctx} />
      <SectionCard
        section={PROJEKTE_SECTIONS[1]!}
        description="Jedes veröffentlichte Projekt steht hier, das neueste zuerst. Bearbeitet werden sie unter „Projekte“."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={"/admin/projekte/neu" as never}>
              <PlusIcon data-icon="inline-start" /> Neues Projekt
            </Link>
          </Button>
        }
      >
        {ctx.projekte.length > 0 ? (
          <ul role="list" className="grid gap-2">
            {ctx.projekte.map((projekt) => (
              <li
                key={projekt.id}
                className={`${tileLinkSurface} flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5`}
              >
                <div className="flex min-w-0 flex-col">
                  <CardLink
                    tile
                    href={`/admin/projekte/${projekt.id}`}
                    className="truncate font-medium"
                  >
                    {projekt.title}
                  </CardLink>
                  <span className="truncate text-xs text-muted-foreground">{projekt.kunde}</span>
                </div>
                <StatusBadge status={projekt.status} hasDraft={projekt.hasDraft} />
              </li>
            ))}
          </ul>
        ) : null}
        <TextField
          control={control}
          name="sections.empty"
          label="Text ohne Projekte"
          description={
            published.length > 0
              ? "Erscheint nur, solange kein Projekt veröffentlicht ist."
              : "Steht gerade auf der Seite: kein Projekt ist veröffentlicht."
          }
        />
      </SectionCard>
      <ClosingSection ctx={ctx} />
      <SeoSection ctx={ctx} />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Kontakt

export const KONTAKT_SECTIONS = [
  { id: "kopf", title: "Kopfbereich", zone: "kopf" },
  { id: "formular", title: "Formular", zone: "formular" },
  { id: "danach", title: "Randspalte", zone: "danach" },
  { id: "suchmaschinen", title: "Suchmaschinen und Teilen" },
];

export function KontaktSections({ ctx }: { ctx: EditorContext }) {
  const control = kindControl<"kontakt">(ctx.control);
  const fields = (ctx.form?.fields ?? []).filter((f) => f.blockType !== "message");
  return (
    <>
      <HeadSection ctx={ctx} />
      <SectionCard
        section={KONTAKT_SECTIONS[1]!}
        description="Die Felder, die Schaltfläche und die Bestätigung nach dem Absenden. Was gesendet wird, landet unter „Anfragen“."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={"/admin/formular" as never}>
              Formular bearbeiten <ArrowUpRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        }
      >
        {fields.length > 0 ? (
          <ul role="list" aria-label="Felder des Formulars" className="flex flex-wrap gap-1.5">
            {fields.map((field) => (
              <li key={field.id}>
                <Badge variant="outline" className="h-6 px-2.5 text-sm font-normal">
                  {"label" in field ? field.label || field.name : field.id}
                  {"required" in field && field.required ? (
                    <span className="text-muted-foreground"> · Pflicht</span>
                  ) : null}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <CircleAlertIcon aria-hidden="true" className="size-4" /> Das Formular hat keine Felder:
            die Seite zeigt stattdessen die E-Mail-Adresse.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Schaltfläche: {ctx.form?.submitButtonLabel || "Absenden"}
        </p>
      </SectionCard>
      <SectionCard
        section={KONTAKT_SECTIONS[2]!}
        description="Neben dem Formular: oben die Kontakt-E-Mail (Website → Fußbereich), darunter dieser Block."
      >
        <TextField control={control} name="sections.nextTitle" label="Überschrift" />
        <Controller
          control={control}
          name="sections.nextText"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="kontakt-next">Text</FieldLabel>
              <LexicalEditor
                key={ctx.editorKey}
                id="kontakt-next"
                label="Text der Randspalte"
                value={field.value ?? null}
                onChange={field.onChange}
                className="[&_[contenteditable]]:min-h-32"
              />
            </Field>
          )}
        />
      </SectionCard>
      <SeoSection ctx={ctx} />
    </>
  );
}
