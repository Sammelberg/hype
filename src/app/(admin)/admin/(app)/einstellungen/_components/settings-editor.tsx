"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SendIcon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { type SiteSettings, SiteSettingsSchema, type Version } from "@/cms/content/types";
import {
  discardSettingsDraftAction,
  publishSettingsAction,
  restoreSettingsVersionAction,
  saveSettingsDraftAction,
} from "../../../_actions/settings";
import { EditorShell } from "../../../_components/editor-shell";
import { ItemCards } from "../../../_components/item-cards";
import { PreviewPane, type PreviewHandle } from "../../../_components/preview-pane";
import {
  SectionCard,
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../_components/sections";
import { TextField } from "../../../_components/text-field";
import { useAutosave } from "../../../_components/use-autosave";
import { VersionsSheet } from "../../../_components/versions-sheet";

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

// What every page of the site shares. Texts of a single page are edited on that page (Seiten).
const SECTIONS: SectionInfo[] = [
  { id: "name", title: "Name", zone: "kopfleiste" },
  { id: "fuss", title: "Fußbereich und Kontakt", zone: "fuss" },
  { id: "anfrage", title: "Abschluss „Anfrage“", zone: "anfrage" },
  { id: "suchmaschinen", title: "Suchmaschinen" },
];
const SECTION_OF: Record<string, string> = {
  siteName: "name",
  ownerName: "fuss",
  tagline: "fuss",
  contactEmail: "fuss",
  socialLinks: "fuss",
  cta: "anfrage",
  description: "suchmaschinen",
};

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
  }, [editing, reset]);

  const dirty = hasDraft || formState.isDirty;
  const invalid = [
    ...new Set(Object.keys(formState.errors).map((key) => SECTION_OF[key] ?? "name")),
  ];

  return (
    <SectionFocusProvider preview={preview}>
      <form onSubmit={onPublish} noValidate>
        <EditorShell
          backHref="/admin"
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
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
          <p className="text-sm text-pretty text-muted-foreground">
            Was jede Seite teilt. Die Texte einer einzelnen Seite, auch der Startseite, bearbeiten
            Sie unter „Seiten“.
          </p>

          <SectionCard
            section={SECTIONS[0]!}
            description="Oben links neben der Tanne, im Fußbereich und am Ende jedes Seitentitels im Browser."
          >
            <TextField control={control} name="siteName" label="Name der Website" />
          </SectionCard>

          <SectionCard
            section={SECTIONS[1]!}
            description="Unten auf jeder Seite. Die E-Mail-Adresse steht auch auf /kontakt und im Impressum, sobald sie gesetzt ist."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={control}
                name="ownerName"
                label="Inhaber"
                description="Im Hinweis „© Jahr Inhaber“."
              />
              <TextField
                control={control}
                name="contactEmail"
                label="Kontakt-E-Mail"
                placeholder="name@beispiel.de"
              />
            </div>
            <TextField
              control={control}
              name="tagline"
              label="Kurzbeschreibung"
              description="Unter dem Namen im Fußbereich."
            />
            <FieldSet>
              <FieldLegend variant="label">Profile</FieldLegend>
              <ItemCards
                control={control}
                name="socialLinks"
                itemLabel={(i) => values.socialLinks?.[i]?.label || `Profil ${i + 1}`}
                addLabel="Profil hinzufügen"
                columns={2}
                make={() => ({ id: newId(), label: "", url: "" })}
                render={(i) => (
                  <div className="grid gap-3">
                    <TextField
                      control={control}
                      name={`socialLinks.${i}.label`}
                      label="Bezeichnung"
                      placeholder="LinkedIn"
                    />
                    <TextField
                      control={control}
                      name={`socialLinks.${i}.url`}
                      label="Adresse"
                      placeholder="https://…"
                    />
                  </div>
                )}
              />
            </FieldSet>
          </SectionCard>

          <SectionCard
            section={SECTIONS[2]!}
            description="Am Ende der Startseite und jeder Inhaltsseite. Die Beschriftung trägt auch die Schaltfläche oben auf der Startseite; sie führt immer zu /kontakt."
          >
            <TextField control={control} name="cta.title" label="Überschrift" />
            <TextField control={control} name="cta.text" label="Text" multiline rows={2} />
            <TextField control={control} name="cta.label" label="Beschriftung der Schaltfläche" />
          </SectionCard>

          <SectionCard
            section={SECTIONS[3]!}
            description="Nicht auf der Seite selbst: die Beschreibung, die Suchmaschinen für die Startseite zeigen, solange sie keine eigene hat."
          >
            <TextField
              control={control}
              name="description"
              label="Beschreibung"
              multiline
              maxLength={160}
              description="Höchstens 160 Zeichen."
            />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
