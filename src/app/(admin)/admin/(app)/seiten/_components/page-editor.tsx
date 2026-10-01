"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOffIcon, SendIcon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { defaultSections } from "@/cms/content/page-sections";
import { kindOf, pathOf, PROTECTED_SLUGS } from "@/cms/content/page-tree";
import {
  type FormDoc,
  type MediaDoc,
  type Page,
  type PageInput,
  PageInputSchema,
  type Projekt,
  type SiteSettings,
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
import { PreviewPane, type PreviewHandle } from "../../../_components/preview-pane";
import {
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../_components/sections";
import { useAutosave } from "../../../_components/use-autosave";
import { VersionsSheet } from "../../../_components/versions-sheet";
import {
  AddressSection,
  ChildrenSection,
  ClosingSection,
  HeadSection,
  SeoSection,
  TextSection,
} from "./common-sections";
import type { EditorContext } from "./editor-context";
import { LEISTUNG_SECTIONS, LeistungSections, leistungSectionOf } from "./leistung-sections";
import {
  HOME_SECTIONS,
  HomeSections,
  KONTAKT_SECTIONS,
  KontaktSections,
  LEISTUNGEN_SECTIONS,
  LeistungenSections,
  PROJEKTE_SECTIONS,
  ProjekteSections,
} from "./routed-sections";

type Props = {
  page: Page | null;
  editing: PageInput;
  pages: Page[];
  media: MediaDoc[];
  versions: Version[];
  projekte?: Projekt[];
  form?: FormDoc | null;
  cta?: SiteSettings["cta"] | null;
};

const LEGAL = new Set(["impressum", "datenschutz"]);

// The cards of a content page, in the order the page shows them; legal pages end with their text.
function contentSections(page: Page | null): SectionInfo[] {
  const legal = page ? LEGAL.has(page.slug) : false;
  return [
    { id: "kopf", title: "Kopfbereich", zone: "kopf" },
    { id: "text", title: "Text", zone: "text" },
    ...(page && !legal ? [{ id: "unterseiten", title: "Seiten darunter" }] : []),
    ...(legal ? [] : [{ id: "anfrage", title: "Abschluss „Anfrage“", zone: "anfrage" }]),
    { id: "suchmaschinen", title: "Suchmaschinen und Teilen" },
    ...(page && PROTECTED_SLUGS.has(page.slug)
      ? []
      : [{ id: "adresse", title: "Adresse und Ordnung" }]),
  ];
}

// Which card holds a field, for the marks in the index.
function sectionOf(path: string): string {
  const leistung = leistungSectionOf(path);
  if (leistung) return leistung;
  if (path.startsWith("sections.hero")) return "kopf";
  if (/^sections\.(servicesTitle|services)/.test(path)) return "leistungen";
  if (/^sections\.steps/.test(path)) return "vorgehen";
  if (/^sections\.principles/.test(path)) return "grundsaetze";
  if (path.startsWith("sections.faq")) return "fragen";
  if (path.startsWith("sections.empty")) return "projekte";
  if (path.startsWith("sections.next")) return "danach";
  if (path === "content") return "text";
  if (path === "meta") return "suchmaschinen";
  if (path === "slug" || path === "parentId") return "adresse";
  return "kopf";
}

function errorPaths(errors: object, prefix = ""): string[] {
  return Object.entries(errors).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!value || typeof value !== "object") return [];
    if ("message" in value && typeof value.message === "string") return [path];
    return errorPaths(value, path);
  });
}

const failure = (result: {
  serverError?: { message: string } | undefined;
  validationErrors?: unknown;
}) =>
  result.serverError?.message ??
  (result.validationErrors ? "Bitte prüfen Sie die markierten Felder." : null);

export function PageEditor({
  page,
  editing,
  pages,
  media,
  versions,
  projekte = [],
  form: contactForm = null,
  cta = null,
}: Props) {
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

  // A page's kind follows from its slug, and for a service's page from its parent (the parent
  // as it is in the form, so moving a page under „Leistungen“ shows the service cards at once).
  const parentSlug = values.parentId
    ? (pages.find((p) => p.id === values.parentId)?.slug ?? null)
    : null;
  const kind = page ? kindOf(page.slug, parentSlug) : kindOf("", parentSlug);
  const parentPath = values.parentId
    ? (pages.find((p) => p.id === values.parentId)?.path ?? null)
    : null;
  const previewPath =
    page && protectedSlug ? page.path : pathOf(values.slug || "seite", parentPath);

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

  // A page that has become a service's page starts with the service sections; one moved away
  // drops them.
  const sectionsKind = values.sections?.kind;
  useEffect(() => {
    if (kind === "leistung" && !sectionsKind)
      setValue("sections", defaultSections("leistung"), { shouldDirty: Boolean(page) });
    if (kind === "content" && sectionsKind === "leistung")
      setValue("sections", null, { shouldDirty: true });
  }, [kind, sectionsKind, setValue, page]);

  // A refreshed server render (publish, restore, discard) brings new values: adopt them.
  const lastEditing = useRef(editing);
  useEffect(() => {
    if (lastEditing.current === editing) return;
    lastEditing.current = editing;
    reset(editing);
    setEditorKey((k) => k + 1);
  }, [editing, reset]);

  const hasDraft = page?.hasDraft || formState.isDirty;
  const sectionList: SectionInfo[] =
    kind === "home"
      ? HOME_SECTIONS
      : kind === "leistungen"
        ? LEISTUNGEN_SECTIONS
        : kind === "leistung"
          ? LEISTUNG_SECTIONS
          : kind === "projekte"
            ? PROJEKTE_SECTIONS
            : kind === "kontakt"
              ? KONTAKT_SECTIONS
              : contentSections(page);
  const invalid = [...new Set(errorPaths(formState.errors).map(sectionOf))];
  const ctx: EditorContext = {
    control,
    setValue,
    values: values as Partial<PageInput>,
    page,
    pages,
    media,
    projekte,
    form: contactForm,
    cta,
    editorKey,
    slugTouched,
    touchSlug: () => setSlugTouched(true),
  };

  return (
    <SectionFocusProvider preview={preview}>
      <form onSubmit={page ? onPublish : onCreate} noValidate>
        <EditorShell
          backHref="/admin/seiten"
          nav={<SectionIndex sections={sectionList} invalid={invalid} />}
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
          {kind === "home" ? <HomeSections ctx={ctx} /> : null}
          {kind === "leistungen" ? <LeistungenSections ctx={ctx} /> : null}
          {kind === "projekte" ? <ProjekteSections ctx={ctx} /> : null}
          {kind === "kontakt" ? <KontaktSections ctx={ctx} /> : null}
          {kind === "leistung" ? (
            <>
              <HeadSection ctx={ctx} />
              <TextSection ctx={ctx} />
              {values.sections?.kind === "leistung" ? <LeistungSections ctx={ctx} /> : null}
              <ClosingSection ctx={ctx} />
              <SeoSection ctx={ctx} />
              <AddressSection ctx={ctx} />
            </>
          ) : null}
          {kind === "content" ? (
            <>
              <HeadSection ctx={ctx} />
              <TextSection ctx={ctx} />
              {sectionList.some((x) => x.id === "unterseiten") ? (
                <ChildrenSection ctx={ctx} />
              ) : null}
              {sectionList.some((x) => x.id === "anfrage") ? <ClosingSection ctx={ctx} /> : null}
              <SeoSection ctx={ctx} />
              {sectionList.some((x) => x.id === "adresse") ? <AddressSection ctx={ctx} /> : null}
            </>
          ) : null}
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
