"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArchiveIcon, ArchiveRestoreIcon, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type KundeInput, KundeSchema } from "@/buero/logik/typen";
import {
  archiveKundeAction,
  createKundeAction,
  deleteKundeAction,
  updateKundeAction,
} from "../../../_actions/buero";
import { ZahlFeld } from "../../../_components/buero/felder";
import { EditorShell } from "../../../_components/editor-shell";
import { ItemCards } from "../../../_components/item-cards";
import {
  SectionCard,
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../_components/sections";
import { TextField } from "../../../_components/text-field";

const SECTIONS: SectionInfo[] = [
  { id: "stammdaten", title: "Kunde" },
  { id: "kontakt", title: "Kontakt" },
  { id: "anschrift", title: "Anschrift" },
  { id: "rechnung", title: "Rechnungsangaben" },
  { id: "notizen", title: "Notizen" },
];
const SECTION_OF: Record<string, string> = {
  art: "stammdaten",
  firma: "stammdaten",
  name: "stammdaten",
  email: "kontakt",
  telefon: "kontakt",
  ansprechpartner: "kontakt",
  strasse: "anschrift",
  plz: "anschrift",
  ort: "anschrift",
  land: "anschrift",
  ustId: "rechnung",
  leitwegId: "rechnung",
  zahlungszielTage: "rechnung",
  notizen: "notizen",
};

const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

const LEER: KundeInput = {
  art: "firma",
  firma: null,
  name: null,
  email: null,
  telefon: null,
  strasse: null,
  plz: null,
  ort: null,
  land: "DE",
  ustId: null,
  leitwegId: null,
  zahlungszielTage: null,
  ansprechpartner: [],
  notizen: null,
};

// The customer card: who they are, how to reach them, where invoices go. Beside it (server
// rendered) what runs with them.
export function KundenEditor({
  id,
  nummer,
  titel,
  kunde,
  archiviert = false,
  uebersicht,
}: {
  id: number | null;
  nummer?: string;
  titel?: string;
  kunde: KundeInput | null;
  archiviert?: boolean;
  uebersicht?: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const form = useForm({
    resolver: zodResolver(KundeSchema),
    defaultValues: kunde ?? LEER,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, setError } = form;
  const art = useWatch({ control, name: "art" });
  const ansprechpartner = useWatch({ control, name: "ansprechpartner" });

  const speichern = handleSubmit(async (input) => {
    setBusy(true);
    const result = id ? await updateKundeAction({ id, input }) : await createKundeAction(input);
    setBusy(false);
    if (result.serverError) {
      if (result.serverError.field)
        setError(result.serverError.field as keyof KundeInput, {
          message: result.serverError.message,
        });
      return void toast.error(result.serverError.message);
    }
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die markierten Felder.");
    if (!id && result.data && "id" in result.data) {
      toast.success("Kunde angelegt.");
      return router.replace(`/admin/kunden/${result.data.id}` as never);
    }
    reset(input);
    toast.success("Gespeichert.");
    router.refresh();
  });

  const archivieren = async () => {
    if (!id) return;
    const result = await archiveKundeAction({ id, archivieren: !archiviert });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success(archiviert ? "Wieder bei den aktiven Kunden." : "Archiviert.");
    router.refresh();
  };

  const loeschen = async () => {
    if (!id) return;
    const result = await deleteKundeAction({ id });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Kunde gelöscht.");
    router.push("/admin/kunden" as never);
  };

  const invalid = [
    ...new Set(Object.keys(formState.errors).map((k) => SECTION_OF[k] ?? "stammdaten")),
  ];

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={speichern} noValidate>
        <EditorShell
          backHref="/admin/kunden"
          backLabel="Kunden"
          title={id ? (titel ?? "Kunde") : "Neuer Kunde"}
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          onDelete={id ? loeschen : undefined}
          deleteLabel="Kunde löschen"
          deleteDescription="Nur für Kunden ohne Aufträge, Verträge und Rechnungen; alle anderen werden archiviert."
          actions={
            <>
              {id ? (
                <Button type="button" variant="ghost" size="sm" onClick={archivieren}>
                  {archiviert ? (
                    <ArchiveRestoreIcon data-icon="inline-start" />
                  ) : (
                    <ArchiveIcon data-icon="inline-start" />
                  )}
                  {archiviert ? "Zurückholen" : "Archivieren"}
                </Button>
              ) : null}
              <Button
                type="submit"
                size="sm"
                disabled={busy || (Boolean(id) && !formState.isDirty)}
              >
                {busy ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SaveIcon data-icon="inline-start" />
                )}
                {id ? "Speichern" : "Kunde anlegen"}
              </Button>
            </>
          }
          aside={uebersicht}
          asideAlways
        >
          <SectionCard
            section={SECTIONS[0]!}
            description={`${nummer ? `Kundennummer ${nummer}. ` : ""}Eine Firma steht mit ihrem Namen auf der Rechnung, eine Privatperson mit ihrem.`}
          >
            <Controller
              control={control}
              name="art"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Art</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                    aria-label="Art des Kunden"
                  >
                    <ToggleGroupItem value="firma">Firma</ToggleGroupItem>
                    <ToggleGroupItem value="privat">Privatperson</ToggleGroupItem>
                  </ToggleGroup>
                </Field>
              )}
            />
            {art === "firma" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={control} name="firma" label="Firmenname" />
                <TextField
                  control={control}
                  name="name"
                  label="Ansprechpartner"
                  description="Die Person, mit der Sie sprechen."
                />
              </div>
            ) : (
              <TextField control={control} name="name" label="Name" />
            )}
          </SectionCard>

          <SectionCard
            section={SECTIONS[1]!}
            description="Die E-Mail-Adresse ist auch die Adresse der E-Rechnung (XRechnung BT-49)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name="email" label="E-Mail" />
              <TextField control={control} name="telefon" label="Telefon" />
            </div>
            <FieldSet>
              <FieldLegend variant="label">Weitere Ansprechpartner</FieldLegend>
              <ItemCards
                control={control}
                name="ansprechpartner"
                itemLabel={(i) => ansprechpartner?.[i]?.name || `Ansprechpartner ${i + 1}`}
                addLabel="Ansprechpartner hinzufügen"
                columns={2}
                make={() => ({ id: newId(), name: "", rolle: null, email: null, telefon: null })}
                render={(i) => (
                  <div className="grid gap-3">
                    <TextField control={control} name={`ansprechpartner.${i}.name`} label="Name" />
                    <TextField
                      control={control}
                      name={`ansprechpartner.${i}.rolle`}
                      label="Rolle"
                      placeholder="Buchhaltung"
                    />
                    <TextField
                      control={control}
                      name={`ansprechpartner.${i}.email`}
                      label="E-Mail"
                    />
                    <TextField
                      control={control}
                      name={`ansprechpartner.${i}.telefon`}
                      label="Telefon"
                    />
                  </div>
                )}
              />
            </FieldSet>
          </SectionCard>

          <SectionCard
            section={SECTIONS[2]!}
            description="Die Rechnungsanschrift (§14 Abs. 4 Nr. 1 UStG)."
          >
            <TextField control={control} name="strasse" label="Straße und Hausnummer" />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)_minmax(0,6rem)]">
              <TextField control={control} name="plz" label="PLZ" />
              <TextField control={control} name="ort" label="Ort" />
              <TextField control={control} name="land" label="Land" />
            </div>
          </SectionCard>

          <SectionCard
            section={SECTIONS[3]!}
            description="Was auf der Rechnung an diesen Kunden zusätzlich steht."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name="ustId" label="USt-IdNr des Kunden" />
              <TextField
                control={control}
                name="leitwegId"
                label="Leitweg-ID"
                description="Nur bei Behörden: sie leitet die E-Rechnung weiter."
              />
            </div>
            <div className="max-w-56">
              <ZahlFeld
                control={control}
                name="zahlungszielTage"
                label="Eigenes Zahlungsziel"
                einheit="Tage"
                description="Leer: das der Firmendaten."
              />
            </div>
          </SectionCard>

          <SectionCard section={SECTIONS[4]!} description="Nur für Sie; erscheint nirgends.">
            <TextField
              control={control}
              name="notizen"
              label="Notizen"
              multiline
              rows={5}
              hideLabel
            />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
