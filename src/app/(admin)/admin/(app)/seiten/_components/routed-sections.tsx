"use client";

import { ArrowUpRightIcon, CircleAlertIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Controller } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { ServiceGlyph } from "@/components/site/service-glyphs";
import type { SectionsOf } from "@/cms/content/page-sections";
import type { Glyph } from "@/cms/content/types";
import { CardLink, tileLinkSurface } from "../../../_components/card-link";
import { ItemCards } from "../../../_components/item-cards";
import { LexicalEditor } from "../../../_components/lexical-editor/editor";
import { SectionCard } from "../../../_components/sections";
import { StatusBadge } from "../../../_components/status-badge";
import { TextField } from "../../../_components/text-field";
import { ChildrenSection, ClosingSection, HeadSection, SeoSection } from "./common-sections";
import { type EditorContext, kindControl, newId } from "./editor-context";

const untitled = (text: string | null | undefined, fallback: string) =>
  text?.trim() ? text : <span className="text-muted-foreground">{fallback}</span>;

// ---------------------------------------------------------------------------------------------
// Startseite

export const HOME_SECTIONS = [
  { id: "kopf", title: "Kopfbereich", zone: "kopf" },
  { id: "technik", title: "Laufband Technik", zone: "technik" },
  { id: "leistungen", title: "Leistungen", zone: "leistungen" },
  { id: "e-rechnung", title: "E-Rechnung", zone: "e-rechnung" },
  { id: "vorgehen", title: "Vorgehen", zone: "vorgehen" },
  { id: "vorschau", title: "Weitere Seiten", zone: "vorschau" },
  { id: "grundsaetze", title: "Grundsätze", zone: "grundsaetze" },
  { id: "anfrage", title: "Abschluss „Anfrage“", zone: "anfrage" },
  { id: "suchmaschinen", title: "Suchmaschinen und Teilen" },
];

const homeSection = (id: string) => HOME_SECTIONS.find((s) => s.id === id)!;

export function HomeSections({ ctx }: { ctx: EditorContext }) {
  const control = kindControl<"home">(ctx.control);
  const sections = ctx.values.sections as Partial<SectionsOf<"home">> | undefined;
  const leistungen = ctx.pages.find((p) => p.slug === "leistungen");
  return (
    <>
      <SectionCard
        section={homeSection("kopf")}
        description="Die große Überschrift über dem Bergpanorama: Anfang, wechselndes Wort, Ende. Der erste Buchstabe erscheint in gebrochener Schrift."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={control} name="sections.hero.headline" label="Anfang" />
          <TextField control={control} name="sections.hero.headlineEnd" label="Ende" />
        </div>
        <FieldSet>
          <FieldLegend variant="label">Wechselnde Wörter</FieldLegend>
          <ItemCards
            control={control}
            name="sections.hero.words"
            itemLabel={(i) => `Wort ${i + 1}`}
            addLabel="Wort hinzufügen"
            min={1}
            columns={3}
            make={() => ({ id: newId(), word: "" })}
            render={(i) => (
              <TextField
                control={control}
                name={`sections.hero.words.${i}.word`}
                label={`Wort ${i + 1}`}
                hideLabel
              />
            )}
          />
        </FieldSet>
        <TextField control={control} name="sections.hero.lead" label="Zeile darunter" />
        <p className="text-sm text-muted-foreground">
          Die Schaltfläche darunter trägt die Beschriftung des Abschlusses „Anfrage“ (Website).
        </p>
      </SectionCard>

      <SectionCard
        section={homeSection("technik")}
        description="Das Band unter dem Kopfbereich, in dem die Logos unseres Stacks durchlaufen. Die Logos sind fest, die Überschrift ist Ihre."
      >
        <TextField control={control} name="sections.techTitle" label="Überschrift" />
      </SectionCard>

      <SectionCard
        section={homeSection("leistungen")}
        description="Die fünf Leistungskarten mit ihren Tälern. Karten und Einleitung gehören der Seite „Leistungen“, hier steht nur die Überschrift."
        action={
          leistungen ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/seiten/${leistungen.id}#abschnitt-leistungen` as never}>
                Leistungen bearbeiten <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          ) : undefined
        }
      >
        <TextField control={control} name="sections.servicesTitle" label="Überschrift" />
      </SectionCard>

      <SectionCard
        section={homeSection("e-rechnung")}
        description="Die Daten der E-Rechnung als Zeitleiste unter den Leistungen, darunter der Link zur Seite „E-Rechnung“."
      >
        <TextField control={control} name="sections.eRechnungTitle" label="Überschrift" />
        <TextField
          control={control}
          name="sections.eRechnungLead"
          label="Einleitung"
          multiline
          rows={2}
        />
        <ItemCards
          control={control}
          name="sections.milestones"
          itemLabel={(i) => sections?.milestones?.[i]?.date || `Datum ${i + 1}`}
          addLabel="Datum hinzufügen"
          columns={2}
          make={() => ({ id: newId(), date: "", title: "", text: "" })}
          render={(i) => (
            <div className="grid gap-3">
              <TextField control={control} name={`sections.milestones.${i}.date`} label="Datum" />
              <TextField control={control} name={`sections.milestones.${i}.title`} label="Titel" />
              <TextField
                control={control}
                name={`sections.milestones.${i}.text`}
                label="Text"
                multiline
                rows={3}
              />
            </div>
          )}
        />
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
        section={homeSection("vorschau")}
        description="Türen zu Datensouveränität, Handwerk, Online-Shops und Technologie. Titel und Text jeder Tür sind der Titel und die Einleitung ihrer Seite; hier steht nur die Überschrift."
      >
        <TextField control={control} name="sections.previewsTitle" label="Überschrift" />
      </SectionCard>

      <SectionCard
        section={homeSection("grundsaetze")}
        description="Drei Grundsätze nebeneinander, darunter der Link zur Arbeitsweise."
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
        {sections?.principles && sections.principles.length % 3 !== 0 ? (
          <p className="text-sm text-muted-foreground">
            Die Seite zeigt drei nebeneinander; {sections.principles.length} lassen eine Lücke.
          </p>
        ) : null}
      </SectionCard>

      <ClosingSection ctx={ctx} />
      <SeoSection ctx={ctx} />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Leistungen

export const LEISTUNGEN_SECTIONS = [
  { id: "kopf", title: "Kopfbereich", zone: "kopf" },
  { id: "leistungen", title: "Die fünf Leistungen", zone: "leistungen" },
  { id: "fragen", title: "Häufige Fragen", zone: "fragen" },
  { id: "unterseiten", title: "Leistungsseiten" },
  { id: "anfrage", title: "Abschluss „Anfrage“", zone: "anfrage" },
  { id: "suchmaschinen", title: "Suchmaschinen und Teilen" },
];

export function LeistungenSections({ ctx }: { ctx: EditorContext }) {
  const control = kindControl<"leistungen">(ctx.control);
  const sections = ctx.values.sections as Partial<SectionsOf<"leistungen">> | undefined;
  const childPaths = new Set(
    ctx.pages.filter((p) => ctx.page && p.parent === ctx.page.id).map((p) => p.path),
  );
  return (
    <>
      <HeadSection
        ctx={ctx}
        description="Überschrift und Einleitung auf /leistungen. Die Einleitung steht auch auf der Startseite unter „Was wir entwickeln“."
      />

      <SectionCard
        section={LEISTUNGEN_SECTIONS[1]!}
        description="Auf /leistungen untereinander, auf der Startseite als Karten mit Tal. Jede hat ihr fest gezeichnetes Symbol; Text und Beispiele sind Ihre."
      >
        <ItemCards
          control={control}
          name="sections.services"
          itemLabel={(i) => sections?.services?.[i]?.title || `Leistung ${i + 1}`}
          fixed
          summary={(i) => {
            const service = sections?.services?.[i];
            return (
              <span className="flex items-center gap-2">
                <ServiceGlyph
                  name={(service?.glyph ?? "web") as Glyph}
                  className="size-5 shrink-0 text-primary-soft"
                />
                <span className="truncate font-medium">
                  {untitled(service?.title, "Ohne Titel")}
                </span>
              </span>
            );
          }}
          render={(i) => {
            const slug = sections?.services?.[i]?.slug;
            const missing = slug && !childPaths.has(`/leistungen/${slug}`);
            return (
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,10rem)]">
                  <TextField
                    control={control}
                    name={`sections.services.${i}.title`}
                    label="Titel"
                  />
                  <TextField
                    control={control}
                    name={`sections.services.${i}.short`}
                    label="Kurzform"
                    description="Im Wechsel der Karten."
                  />
                </div>
                <TextField
                  control={control}
                  name={`sections.services.${i}.text`}
                  label="Text"
                  multiline
                  rows={3}
                />
                <TextField
                  control={control}
                  name={`sections.services.${i}.slug`}
                  label="Seite unter /leistungen/"
                  inputClassName="font-mono"
                  description={
                    missing
                      ? `Unter /leistungen/${slug} gibt es noch keine Seite: der Link führt ins Leere.`
                      : "Die Leistungsseite mit dem ausführlichen Text."
                  }
                />
                <FieldSet>
                  <FieldLegend variant="label">Beispiele</FieldLegend>
                  <ItemCards
                    control={control}
                    name={`sections.services.${i}.examples`}
                    itemLabel={(j) => `Beispiel ${j + 1}`}
                    addLabel="Beispiel hinzufügen"
                    make={() => ({ id: newId(), text: "" })}
                    render={(j) => (
                      <TextField
                        control={control}
                        name={`sections.services.${i}.examples.${j}.text`}
                        label={`Beispiel ${j + 1}`}
                        hideLabel
                      />
                    )}
                  />
                </FieldSet>
              </div>
            );
          }}
        />
      </SectionCard>

      <SectionCard
        section={LEISTUNGEN_SECTIONS[2]!}
        description="Unter den Leistungen auf /leistungen. Eine Frage pro Karte; ein Klick klappt die Antwort auf."
      >
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

      <ChildrenSection
        ctx={ctx}
        title="Leistungsseiten"
        description="Die ausführlichen Seiten der fünf Leistungen, im Menü unter „Leistungen“."
      />
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
