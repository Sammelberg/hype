"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOffIcon, SendIcon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  canMove,
  flattenTree,
  HOME_SLUG,
  pathOf,
  PROTECTED_SLUGS,
  slugify,
} from "@/cms/content/page-tree";
import {
  type MediaDoc,
  type Page,
  type PageInput,
  PageInputSchema,
  type Version,
} from "@/cms/content/types";
import {
  createPageAction,
  deletePageAction,
  discardPageDraftAction,
  publishPageAction,
  restorePageVersionAction,
  savePageDraftAction,
  unpublishPageAction,
} from "../../../_actions/pages";
import { EditorShell } from "../../../_components/editor-shell";
import { LexicalEditor } from "../../../_components/lexical-editor/editor";
import { PreviewPane, type PreviewHandle } from "../../../_components/preview-pane";
import { SeoFields } from "../../../_components/seo-fields";
import { useAutosave } from "../../../_components/use-autosave";
import { VersionsSheet } from "../../../_components/versions-sheet";

type Props = {
  page: Page | null;
  editing: PageInput;
  pages: Page[];
  media: MediaDoc[];
  versions: Version[];
};

const failure = (result: {
  serverError?: { message: string } | undefined;
  validationErrors?: unknown;
}) =>
  result.serverError?.message ??
  (result.validationErrors ? "Bitte prüfen Sie die markierten Felder." : null);

export function PageEditor({ page, editing, pages, media, versions }: Props) {
  const router = useRouter();
  const preview = useRef<PreviewHandle>(null);
  const [busy, setBusy] = useState<"publish" | "unpublish" | "discard" | "create" | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(page));
  const [editorKey, setEditorKey] = useState(0);

  const form = useForm<PageInput>({
    resolver: zodResolver(PageInputSchema),
    defaultValues: editing,
    mode: "onBlur",
  });
  const { control, handleSubmit, setValue, setError, reset, formState } = form;
  const values = useWatch({ control });
  const protectedSlug = page ? PROTECTED_SLUGS.has(page.slug) : false;

  // Parent choices: every other page, in tree order, minus the page's own subtree.
  const tree = pages.map((p) => ({ id: p.id, slug: p.slug, title: p.title, parentId: p.parent }));
  const parentOptions = flattenTree(tree, (a, b) => a.id - b.id).filter(
    (n) => !page || (n.id !== page.id && canMove(page.id, n.id, tree)),
  );
  const parentPath = values.parentId
    ? (pages.find((p) => p.id === values.parentId)?.path ?? null)
    : null;
  const previewPath = pathOf(values.slug || "seite", parentPath);

  const save = useCallback(
    async (input: PageInput) => {
      if (!page) return;
      const result = await savePageDraftAction({ id: page.id, input });
      const message = failure(result);
      if (message) throw new Error(message);
      preview.current?.refresh();
    },
    [page],
  );
  const autosave = useAutosave(values as PageInput, Boolean(page) && formState.isDirty, save);

  // Errors the server pins to a field (a taken slug) land under that field.
  const applyFailure = (result: {
    serverError?: { message: string; field?: string } | undefined;
    validationErrors?: unknown;
  }) => {
    const message = failure(result);
    if (!message) return false;
    if (result.serverError?.field)
      setError(result.serverError.field as keyof PageInput, { message });
    toast.error(message);
    return true;
  };

  const onCreate = handleSubmit(async (input) => {
    setBusy("create");
    const result = await createPageAction(input);
    setBusy(null);
    if (applyFailure(result) || !result.data) return;
    toast.success("Seite angelegt. Sie ist noch ein Entwurf.");
    router.replace(`/admin/seiten/${result.data.id}` as never);
  });

  const onPublish = handleSubmit(async (input) => {
    if (!page) return;
    setBusy("publish");
    const result = await publishPageAction({ id: page.id, input });
    setBusy(null);
    if (applyFailure(result)) return;
    reset(input);
    autosave.setState({ status: "idle" });
    toast.success("Veröffentlicht. Die Seite ist jetzt online.");
    router.refresh();
  });

  const onUnpublish = async () => {
    if (!page) return;
    setBusy("unpublish");
    const result = await unpublishPageAction({ id: page.id });
    setBusy(null);
    if (applyFailure(result)) return;
    toast.success("Zurückgezogen. Die Seite ist nicht mehr online.");
    router.refresh();
  };

  const onDiscard = async () => {
    if (!page) return;
    setBusy("discard");
    const result = await discardPageDraftAction({ id: page.id });
    setBusy(null);
    if (applyFailure(result)) return;
    toast.success("Änderungen verworfen.");
    router.refresh();
  };

  const onDelete = async () => {
    if (!page) return;
    const result = await deletePageAction({ id: page.id });
    if (applyFailure(result)) return;
    toast.success("Seite gelöscht.");
    router.push("/admin/seiten" as never);
  };

  const onRestore = async (versionId: number) => {
    if (!page) return;
    const result = await restorePageVersionAction({ id: page.id, versionId });
    if (applyFailure(result)) return;
    toast.success("Version in den Entwurf geladen. Veröffentlichen Sie, wenn sie passt.");
    router.refresh();
  };

  // A refreshed server render (publish, restore, discard) brings new values: adopt them.
  const lastEditing = useRef(editing);
  useEffect(() => {
    if (lastEditing.current === editing) return;
    lastEditing.current = editing;
    reset(editing);
    setEditorKey((k) => k + 1);
  }, [editing, reset]);

  const hasDraft = page?.hasDraft || formState.isDirty;

  return (
    <form onSubmit={page ? onPublish : onCreate} noValidate>
      <EditorShell
        backHref="/admin/seiten"
        backLabel="Seiten"
        title={values.title || (page ? page.title : "Neue Seite")}
        status={page?.status}
        hasDraft={hasDraft}
        saveState={page ? autosave.state : undefined}
        onDelete={page && !protectedSlug ? onDelete : undefined}
        deleteLabel="Seite löschen"
        deleteDescription="Die Seite verschwindet von der Website und aus der Navigation. Seiten darunter müssen vorher verschoben werden."
        actions={
          page ? (
            <>
              <VersionsSheet versions={versions} onRestore={onRestore} />
              {page.hasDraft ? (
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
              {page.status === "published" && !protectedSlug ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={onUnpublish}
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
                disabled={busy !== null || (page.status === "published" && !hasDraft)}
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
              Seite anlegen
            </Button>
          )
        }
        aside={
          page ? (
            <PreviewPane
              ref={preview}
              path={previewPath}
              className="sticky top-20 h-[calc(100vh-6.5rem)]"
            />
          ) : undefined
        }
      >
        <Tabs defaultValue="inhalt">
          <TabsList>
            <TabsTrigger value="inhalt">Inhalt</TabsTrigger>
            <TabsTrigger value="seo">Suchmaschinen</TabsTrigger>
            <TabsTrigger value="einstellungen">Adresse und Ordnung</TabsTrigger>
          </TabsList>

          <TabsContent value="inhalt" className="pt-4">
            <FieldGroup>
              <Controller
                control={control}
                name="title"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="page-title">Titel</FieldLabel>
                    <Input
                      id="page-title"
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
                name="lead"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="page-lead">Einleitung</FieldLabel>
                    <Textarea
                      id="page-lead"
                      {...field}
                      value={field.value ?? ""}
                      rows={3}
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    <FieldDescription>
                      Steht neben der Überschrift und in Listen, die auf diese Seite verweisen.
                    </FieldDescription>
                    {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="content"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="page-content">Text</FieldLabel>
                    <LexicalEditor
                      key={editorKey}
                      id="page-content"
                      label="Text der Seite"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={fieldState.invalid}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </TabsContent>

          <TabsContent value="seo" className="pt-4">
            <SeoFields
              control={control}
              media={media}
              fallbackTitle={values.title || "Titel der Seite"}
            />
          </TabsContent>

          <TabsContent value="einstellungen" className="pt-4">
            <FieldGroup>
              <Controller
                control={control}
                name="parentId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="page-parent">Liegt unter</FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                      disabled={protectedSlug}
                    >
                      <SelectTrigger id="page-parent" className="w-full max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">Oberste Ebene</SelectItem>
                          {parentOptions.map((n) => (
                            <SelectItem key={n.id} value={String(n.id)}>
                              {"  ".repeat(n.depth)}
                              {n.title}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Eine Seite unter „Leistungen“ erscheint in dessen Menü und bekommt dessen
                      Adresse vorangestellt.
                    </FieldDescription>
                    {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="slug"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="page-slug">Adresse</FieldLabel>
                    <Input
                      id="page-slug"
                      {...field}
                      className="max-w-md font-mono"
                      disabled={protectedSlug}
                      aria-invalid={fieldState.invalid || undefined}
                      onChange={(e) => {
                        setSlugTouched(true);
                        field.onChange(e);
                      }}
                    />
                    <FieldDescription>
                      Wird zu <code className="rounded bg-muted px-1">{previewPath}</code>.{" "}
                      {protectedSlug
                        ? values.slug === HOME_SLUG
                          ? "Die Startseite bleibt unter /."
                          : "Diese Adresse ist fest: der Fußbereich verweist darauf."
                        : "Kleinbuchstaben, Ziffern und Bindestriche."}
                    </FieldDescription>
                    {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </TabsContent>
        </Tabs>
      </EditorShell>
    </form>
  );
}
