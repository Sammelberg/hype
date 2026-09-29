"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SendIcon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Control, Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ServiceGlyph } from "@/components/site/service-glyphs";
import {
  type Glyph,
  type SiteSettings,
  SiteSettingsSchema,
  type Version,
} from "@/cms/content/types";
import {
  discardSettingsDraftAction,
  publishSettingsAction,
  restoreSettingsVersionAction,
  saveSettingsDraftAction,
} from "../../../_actions/settings";
import { EditorShell } from "../../../_components/editor-shell";
import { LexicalEditor } from "../../../_components/lexical-editor/editor";
import { PreviewPane, type PreviewHandle } from "../../../_components/preview-pane";
import { useAutosave } from "../../../_components/use-autosave";
import { VersionsSheet } from "../../../_components/versions-sheet";
import { ListFields } from "./list-fields";

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    : String(Math.random()).slice(2, 18);

const failure = (result: {
  serverError?: { message: string } | undefined;
  validationErrors?: unknown;
}) =>
  result.serverError?.message ??
  (result.validationErrors ? "Bitte prüfen Sie die markierten Felder." : null);

function TextField({
  control,
  name,
  label,
  description,
  multiline = false,
  rows = 3,
  maxLength,
}: {
  control: Control<SiteSettings>;
  name: string;
  label: string;
  description?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}) {
  const id = `settings-${name.replace(/\W+/g, "-")}`;
  return (
    <Controller
      control={control}
      name={name as "siteName"}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {multiline ? (
            <Textarea
              id={id}
              {...field}
              value={(field.value as string | null) ?? ""}
              rows={rows}
              maxLength={maxLength}
              aria-invalid={fieldState.invalid || undefined}
            />
          ) : (
            <Input
              id={id}
              {...field}
              value={(field.value as string | null) ?? ""}
              maxLength={maxLength}
              aria-invalid={fieldState.invalid || undefined}
            />
          )}
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
        </Field>
      )}
    />
  );
}

export function SettingsEditor({
  editing,
  hasDraft,
  versions,
}: {
  editing: SiteSettings;
  hasDraft: boolean;
  versions: Version[];
}) {
  const router = useRouter();
  const preview = useRef<PreviewHandle>(null);
  const [busy, setBusy] = useState<"publish" | "discard" | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const form = useForm<SiteSettings>({
    resolver: zodResolver(SiteSettingsSchema),
    defaultValues: editing,
    mode: "onBlur",
  });
  const { control, handleSubmit, reset, formState } = form;
  const values = useWatch({ control });

  const save = useCallback(async (input: SiteSettings) => {
    const result = await saveSettingsDraftAction(input);
    const message = failure(result);
    if (message) throw new Error(message);
    preview.current?.refresh();
  }, []);
  const autosave = useAutosave(values as SiteSettings, formState.isDirty, save);

  const onPublish = handleSubmit(async (input) => {
    setBusy("publish");
    const result = await publishSettingsAction({ input });
    setBusy(null);
    const message = failure(result);
    if (message) return void toast.error(message);
    reset(input);
    autosave.setState({ status: "idle" });
    toast.success("Veröffentlicht. Die Website zeigt die neuen Texte.");
    router.refresh();
  });

  const onDiscard = async () => {
    setBusy("discard");
    const result = await discardSettingsDraftAction();
    setBusy(null);
    const message = failure(result);
    if (message) return void toast.error(message);
    toast.success("Änderungen verworfen.");
    router.refresh();
  };

  const onRestore = async (versionId: number) => {
    const result = await restoreSettingsVersionAction({ versionId });
    const message = failure(result);
    if (message) return void toast.error(message);
    toast.success("Version in den Entwurf geladen.");
    router.refresh();
  };

  const lastEditing = useRef(editing);
  useEffect(() => {
    if (lastEditing.current === editing) return;
    lastEditing.current = editing;
    reset(editing);
    setEditorKey((k) => k + 1);
  }, [editing, reset]);

  const dirty = hasDraft || formState.isDirty;
  const invalidTabs = Object.keys(formState.errors);

  return (
    <form onSubmit={onPublish} noValidate>
      <EditorShell
        backHref="/admin"
        backLabel="Übersicht"
        title="Website"
        status="published"
        hasDraft={dirty}
        saveState={autosave.state}
        actions={
          <>
            <VersionsSheet versions={versions} onRestore={onRestore} />
            {hasDraft ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy !== null}
                onClick={onDiscard}
              >
                <Undo2Icon data-icon="inline-start" /> Verwerfen
              </Button>
            ) : null}
            <Button type="submit" size="sm" disabled={busy !== null || !dirty}>
              {busy === "publish" ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SendIcon data-icon="inline-start" />
              )}
              Veröffentlichen
            </Button>
          </>
        }
        aside={
          <PreviewPane ref={preview} path="/" className="sticky top-20 h-[calc(100vh-6.5rem)]" />
        }
      >
        {invalidTabs.length > 0 ? (
          <p className="text-sm text-destructive">Bitte prüfen Sie die markierten Felder.</p>
        ) : null}
        <Tabs defaultValue="allgemein">
          <TabsList>
            <TabsTrigger value="allgemein">Allgemein</TabsTrigger>
            <TabsTrigger value="startseite">Startseite</TabsTrigger>
            <TabsTrigger value="leistungen">Leistungen</TabsTrigger>
            <TabsTrigger value="weitere">Projekte und Kontakt</TabsTrigger>
          </TabsList>

          <TabsContent value="allgemein" className="pt-4">
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  control={control}
                  name="siteName"
                  label="Name der Website"
                  description="Im Kopf, im Fußbereich und in jedem Seitentitel."
                />
                <TextField control={control} name="ownerName" label="Inhaber" />
              </div>
              <TextField
                control={control}
                name="tagline"
                label="Kurzbeschreibung"
                description="Im Fußbereich unter dem Namen."
              />
              <TextField
                control={control}
                name="description"
                label="Beschreibung für Suchmaschinen"
                multiline
                maxLength={160}
                description="Höchstens 160 Zeichen; gilt für die Startseite."
              />
              <TextField
                control={control}
                name="contactEmail"
                label="Kontakt-E-Mail"
                description="Im Fußbereich, auf /kontakt und im Impressum, sobald gesetzt."
              />
              <ListFields
                control={control}
                name="socialLinks"
                legend="Profile"
                description="Links im Fußbereich, etwa zu LinkedIn oder GitHub."
                addLabel="Profil hinzufügen"
                make={() => ({ id: newId(), label: "", url: "" })}
                render={(i) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField
                      control={control}
                      name={`socialLinks.${i}.label`}
                      label="Bezeichnung"
                    />
                    <TextField control={control} name={`socialLinks.${i}.url`} label="Adresse" />
                  </div>
                )}
              />
              <FieldGroup className="rounded-lg border p-4">
                <p className="font-medium">Abschluss „Anfrage“</p>
                <p className="-mt-3 text-sm text-muted-foreground">
                  Am Ende der Startseite und der Inhaltsseiten; die Beschriftung gilt auch für den
                  Aufruf oben auf der Startseite.
                </p>
                <TextField control={control} name="cta.title" label="Überschrift" />
                <TextField control={control} name="cta.text" label="Text" multiline rows={2} />
                <TextField
                  control={control}
                  name="cta.label"
                  label="Beschriftung der Schaltfläche"
                  description="Führt immer zu /kontakt."
                />
              </FieldGroup>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="startseite" className="pt-4">
            <FieldGroup>
              <FieldGroup className="rounded-lg border p-4">
                <p className="font-medium">Überschrift</p>
                <p className="-mt-3 text-sm text-muted-foreground">
                  Anfang, wechselndes Wort, Ende — „Wir entwickeln | mobile Apps | für den
                  Mittelstand.“ Der erste Buchstabe erscheint in gebrochener Schrift.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField control={control} name="hero.headline" label="Anfang" />
                  <TextField control={control} name="hero.headlineEnd" label="Ende" />
                </div>
                <ListFields
                  control={control}
                  name="hero.words"
                  legend="Wechselnde Wörter"
                  addLabel="Wort hinzufügen"
                  min={1}
                  make={() => ({ id: newId(), word: "" })}
                  render={(i) => (
                    <TextField control={control} name={`hero.words.${i}.word`} label="Wort" />
                  )}
                />
                <TextField control={control} name="hero.lead" label="Zeile darunter" />
              </FieldGroup>
              <TextField control={control} name="servicesTitle" label="Überschrift Leistungen" />
              <TextField
                control={control}
                name="servicesIntro"
                label="Einleitung Leistungen"
                multiline
                rows={2}
                description="Unter der Überschrift auf der Startseite und auf /leistungen."
              />
              <TextField control={control} name="stepsTitle" label="Überschrift Vorgehen" />
              <ListFields
                control={control}
                name="steps"
                legend="So arbeiten wir"
                addLabel="Schritt hinzufügen"
                make={() => ({ id: newId(), title: "", text: "" })}
                render={(i) => (
                  <div className="grid gap-3">
                    <TextField control={control} name={`steps.${i}.title`} label="Titel" />
                    <TextField
                      control={control}
                      name={`steps.${i}.text`}
                      label="Text"
                      multiline
                      rows={2}
                    />
                  </div>
                )}
              />
              <TextField control={control} name="principlesTitle" label="Überschrift Grundsätze" />
              <ListFields
                control={control}
                name="principles"
                legend="Grundsätze"
                addLabel="Grundsatz hinzufügen"
                make={() => ({ id: newId(), title: "", text: "" })}
                render={(i) => (
                  <div className="grid gap-3">
                    <TextField control={control} name={`principles.${i}.title`} label="Titel" />
                    <TextField
                      control={control}
                      name={`principles.${i}.text`}
                      label="Text"
                      multiline
                      rows={2}
                    />
                  </div>
                )}
              />
            </FieldGroup>
          </TabsContent>

          <TabsContent value="leistungen" className="pt-4">
            <FieldGroup>
              <ListFields
                control={control}
                name="services"
                legend="Die fünf Leistungen"
                description="Jede hat ihr fest gezeichnetes Symbol; Text und Beispiele sind Ihre. Die Adresse muss zur Seite unter /leistungen passen."
                addLabel=""
                fixed
                make={() => ({
                  id: newId(),
                  title: "",
                  short: "",
                  slug: "",
                  glyph: "web" as const,
                  text: "",
                  examples: [],
                })}
                render={(i) => (
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <ServiceGlyph
                        name={(values.services?.[i]?.glyph ?? "web") as Glyph}
                        className="size-8 shrink-0 text-primary-soft"
                      />
                      <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
                        <TextField control={control} name={`services.${i}.title`} label="Titel" />
                        <TextField
                          control={control}
                          name={`services.${i}.short`}
                          label="Kurzform"
                        />
                      </div>
                    </div>
                    <TextField
                      control={control}
                      name={`services.${i}.text`}
                      label="Text"
                      multiline
                      rows={2}
                    />
                    <TextField
                      control={control}
                      name={`services.${i}.slug`}
                      label="Adresse unter /leistungen/"
                    />
                    <ListFields
                      control={control}
                      name={`services.${i}.examples`}
                      legend="Beispiele"
                      addLabel="Beispiel hinzufügen"
                      make={() => ({ id: newId(), text: "" })}
                      render={(j) => (
                        <TextField
                          control={control}
                          name={`services.${i}.examples.${j}.text`}
                          label="Beispiel"
                        />
                      )}
                    />
                  </div>
                )}
              />
              <ListFields
                control={control}
                name="faq"
                legend="Häufige Fragen"
                description="Auf /leistungen unter den Leistungen."
                addLabel="Frage hinzufügen"
                make={() => ({ id: newId(), question: "", answer: "" })}
                render={(i) => (
                  <div className="grid gap-3">
                    <TextField control={control} name={`faq.${i}.question`} label="Frage" />
                    <TextField
                      control={control}
                      name={`faq.${i}.answer`}
                      label="Antwort"
                      multiline
                      rows={3}
                    />
                  </div>
                )}
              />
            </FieldGroup>
          </TabsContent>

          <TabsContent value="weitere" className="pt-4">
            <FieldGroup>
              <TextField
                control={control}
                name="projekteLead"
                label="Einleitung Projekte"
                multiline
                rows={2}
                description="Neben der Überschrift auf /projekte."
              />
              <TextField
                control={control}
                name="projekteEmpty"
                label="Text ohne Projekte"
                description="Steht auf /projekte, solange kein Projekt veröffentlicht ist."
              />
              <TextField
                control={control}
                name="kontaktLead"
                label="Einleitung Kontakt"
                multiline
                rows={2}
                description="Neben der Überschrift auf /kontakt."
              />
              <FieldGroup className="rounded-lg border p-4">
                <p className="font-medium">Was danach passiert</p>
                <p className="-mt-3 text-sm text-muted-foreground">
                  Randspalte auf /kontakt neben dem Formular.
                </p>
                <TextField control={control} name="kontaktNext.title" label="Überschrift" />
                <Controller
                  control={control}
                  name="kontaktNext.text"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="settings-kontakt-next">Text</FieldLabel>
                      <LexicalEditor
                        key={editorKey}
                        id="settings-kontakt-next"
                        label="Was danach passiert"
                        value={field.value ?? null}
                        onChange={field.onChange}
                        className="[&_[contenteditable]]:min-h-32"
                      />
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldGroup>
          </TabsContent>
        </Tabs>
      </EditorShell>
    </form>
  );
}
