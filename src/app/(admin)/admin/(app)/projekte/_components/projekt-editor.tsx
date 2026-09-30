"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOffIcon, SendIcon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/cms/content/page-tree";
import { projektPathOf as projektPath } from "@/cms/paths";
import {
  type MediaDoc,
  type Projekt,
  type ProjektInput,
  ProjektInputSchema,
  type Version,
} from "@/cms/content/types";
import {
  createProjektAction,
  deleteProjektAction,
  discardProjektDraftAction,
  publishProjektAction,
  restoreProjektVersionAction,
  saveProjektDraftAction,
  unpublishProjektAction,
} from "../../../_actions/projekte";
import { EditorShell } from "../../../_components/editor-shell";
import { LexicalEditor } from "../../../_components/lexical-editor/editor";
import { PreviewPane, type PreviewHandle } from "../../../_components/preview-pane";
import {
  SectionCard,
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../_components/sections";
import { SeoFields } from "../../../_components/seo-fields";
import { useAutosave } from "../../../_components/use-autosave";
import { VersionsSheet } from "../../../_components/versions-sheet";

type Props = {
  projekt: Projekt | null;
  editing: ProjektInput;
  media: MediaDoc[];
  versions: Version[];
};

const failure = (result: {
  serverError?: { message: string } | undefined;
  validationErrors?: unknown;
}) =>
  result.serverError?.message ??
  (result.validationErrors ? "Bitte prüfen Sie die markierten Felder." : null);

const SECTIONS: SectionInfo[] = [
  { id: "kopf", title: "Kopfbereich", zone: "kopf" },
  { id: "text", title: "Text", zone: "text" },
  { id: "suchmaschinen", title: "Suchmaschinen und Teilen" },
  { id: "adresse", title: "Adresse" },
];

export function ProjektEditor({ projekt, editing, media, versions }: Props) {
  const router = useRouter();
  const preview = useRef<PreviewHandle>(null);
  const [busy, setBusy] = useState<"publish" | "unpublish" | "discard" | "create" | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(projekt));
  const [editorKey, setEditorKey] = useState(0);

  const form = useForm<ProjektInput>({
    resolver: zodResolver(ProjektInputSchema),
    defaultValues: editing,
    mode: "onBlur",
  });
  const { control, handleSubmit, setValue, setError, reset, formState } = form;
  const values = useWatch({ control });
  const previewPath = projektPath(values.slug || "projekt");

  const save = useCallback(
    async (input: ProjektInput) => {
      if (!projekt) return;
      const result = await saveProjektDraftAction({ id: projekt.id, input });
      const message = failure(result);
      if (message) throw new Error(message);
      preview.current?.refresh();
    },
    [projekt],
  );
  const autosave = useAutosave(values as ProjektInput, Boolean(projekt) && formState.isDirty, save);

  const applyFailure = (result: {
    serverError?: { message: string; field?: string } | undefined;
    validationErrors?: unknown;
  }) => {
    const message = failure(result);
    if (!message) return false;
    if (result.serverError?.field)
      setError(result.serverError.field as keyof ProjektInput, { message });
    toast.error(message);
    return true;
  };

  const onCreate = handleSubmit(async (input) => {
    setBusy("create");
    const result = await createProjektAction(input);
    setBusy(null);
    if (applyFailure(result) || !result.data) return;
    toast.success("Projekt angelegt. Es ist noch ein Entwurf.");
    router.replace(`/admin/projekte/${result.data.id}` as never);
  });

  const onPublish = handleSubmit(async (input) => {
    if (!projekt) return;
    setBusy("publish");
    const result = await publishProjektAction({ id: projekt.id, input });
    setBusy(null);
    if (applyFailure(result)) return;
    reset(input);
    autosave.setState({ status: "idle" });
    toast.success("Veröffentlicht. Das Projekt ist jetzt online.");
    router.refresh();
  });

  const run = async (kind: "unpublish" | "discard", message: string) => {
    if (!projekt) return;
    setBusy(kind);
    const result =
      kind === "unpublish"
        ? await unpublishProjektAction({ id: projekt.id })
        : await discardProjektDraftAction({ id: projekt.id });
    setBusy(null);
    if (applyFailure(result)) return;
    toast.success(message);
    router.refresh();
  };

  const onDelete = async () => {
    if (!projekt) return;
    const result = await deleteProjektAction({ id: projekt.id });
    if (applyFailure(result)) return;
    toast.success("Projekt gelöscht.");
    router.push("/admin/projekte" as never);
  };

  const onRestore = async (versionId: number) => {
    if (!projekt) return;
    const result = await restoreProjektVersionAction({ id: projekt.id, versionId });
    if (applyFailure(result)) return;
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

  const hasDraft = projekt?.hasDraft || formState.isDirty;

  const invalid = [
    ...new Set(
      Object.keys(formState.errors).map((key) =>
        key === "content"
          ? "text"
          : key === "meta"
            ? "suchmaschinen"
            : key === "slug"
              ? "adresse"
              : "kopf",
      ),
    ),
  ];

  return (
    <SectionFocusProvider preview={preview}>
      <form onSubmit={projekt ? onPublish : onCreate} noValidate>
        <EditorShell
          backHref="/admin/projekte"
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          backLabel="Projekte"
          title={values.title || (projekt ? projekt.title : "Neues Projekt")}
          status={projekt?.status}
          hasDraft={hasDraft}
          saveState={projekt ? autosave.state : undefined}
          onDelete={projekt ? onDelete : undefined}
          deleteLabel="Projekt löschen"
          deleteDescription="Das Projekt verschwindet von der Website und aus der Navigation."
          actions={
            projekt ? (
              <>
                <VersionsSheet versions={versions} onRestore={onRestore} />
                {projekt.hasDraft ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => run("discard", "Änderungen verworfen.")}
                  >
                    <Undo2Icon data-icon="inline-start" /> Verwerfen
                  </Button>
                ) : null}
                {projekt.status === "published" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => run("unpublish", "Zurückgezogen.")}
                  >
                    {busy === "unpublish" ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <EyeOffIcon data-icon="inline-start" />
                    )}
                    Zurückziehen
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  size="sm"
                  disabled={busy !== null || (projekt.status === "published" && !hasDraft)}
                >
                  {busy === "publish" ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <SendIcon data-icon="inline-start" />
                  )}
                  Veröffentlichen
                </Button>
              </>
            ) : (
              <Button type="submit" size="sm" disabled={busy !== null}>
                {busy === "create" ? <Spinner data-icon="inline-start" /> : null}
                Projekt anlegen
              </Button>
            )
          }
          aside={
            projekt ? (
              <PreviewPane
                ref={preview}
                path={previewPath}
                className="sticky top-20 h-[calc(100vh-6.5rem)]"
              />
            ) : undefined
          }
        >
          <SectionCard
            section={SECTIONS[0]!}
            description="Kunde, Titel und Kurzbeschreibung oben auf der Projektseite; Titel und Kurzbeschreibung auch in der Übersicht unter /projekte."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                control={control}
                name="title"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="projekt-title">Titel</FieldLabel>
                    <Input
                      id="projekt-title"
                      {...field}
                      className="h-10 text-lg font-medium"
                      aria-invalid={fieldState.invalid || undefined}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!slugTouched)
                          setValue("slug", slugify(e.target.value), { shouldDirty: true });
                      }}
                    />
                    {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="kunde"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="projekt-kunde">Kunde</FieldLabel>
                    <Input
                      id="projekt-kunde"
                      {...field}
                      className="h-10"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    <FieldDescription>Steht als Zeile über dem Titel.</FieldDescription>
                    {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                  </Field>
                )}
              />
            </div>
            <Controller
              control={control}
              name="summary"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="projekt-summary">Kurzbeschreibung</FieldLabel>
                  <Textarea
                    id="projekt-summary"
                    {...field}
                    rows={3}
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  <FieldDescription>
                    Zwei Sätze für die Projektübersicht und neben der Überschrift.
                  </FieldDescription>
                  {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </Field>
              )}
            />
          </SectionCard>
          <SectionCard
            section={SECTIONS[1]!}
            description="Der Bericht über das Projekt: Ausgangslage, Lösung, Ergebnis."
          >
            <Controller
              control={control}
              name="content"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="projekt-content">Text</FieldLabel>
                  <LexicalEditor
                    key={editorKey}
                    id="projekt-content"
                    label="Text des Projekts"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                </Field>
              )}
            />
          </SectionCard>
          <SectionCard
            section={SECTIONS[2]!}
            description="Nicht auf der Seite selbst: was Google und Messenger zeigen. Leer gilt der Titel und die Kurzbeschreibung."
          >
            <SeoFields
              control={control}
              media={media}
              fallbackTitle={values.title || "Titel des Projekts"}
            />
          </SectionCard>
          <SectionCard
            section={SECTIONS[3]!}
            description="Unter welcher Adresse das Projekt steht."
          >
            <Controller
              control={control}
              name="slug"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="projekt-slug">Adresse</FieldLabel>
                  <Input
                    id="projekt-slug"
                    {...field}
                    className="max-w-md font-mono"
                    aria-invalid={fieldState.invalid || undefined}
                    onChange={(e) => {
                      setSlugTouched(true);
                      field.onChange(e);
                    }}
                  />
                  <FieldDescription>
                    Wird zu <code className="rounded bg-muted px-1">{previewPath}</code>.
                  </FieldDescription>
                  {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </Field>
              )}
            />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
