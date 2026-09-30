"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { type AuftragInput, AuftragSchema } from "@/buero/logik/typen";
import {
  createAuftragAction,
  deleteAuftragAction,
  updateAuftragAction,
} from "../../../_actions/buero";
import type { KundeOption } from "@/buero/daten/kunden";
import { DatumFeld, ZahlFeld } from "../../../_components/buero/felder";
import { KundenWahl } from "../../../_components/buero/kunden-wahl";
import { EditorShell } from "../../../_components/editor-shell";
import {
  SectionCard,
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../_components/sections";
import { TextField } from "../../../_components/text-field";

const SECTIONS: SectionInfo[] = [
  { id: "auftrag", title: "Auftrag" },
  { id: "umfang", title: "Umfang und Zeitraum" },
  { id: "notizen", title: "Notizen" },
];

export function AuftragEditor({
  id,
  nummer,
  auftrag,
  kunden,
  seite,
}: {
  id: number | null;
  nummer?: string;
  auftrag: AuftragInput;
  kunden: KundeOption[];
  seite?: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [kundenListe, setKundenListe] = useState(kunden);
  const form = useForm({
    resolver: zodResolver(AuftragSchema),
    defaultValues: auftrag,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset } = form;

  const speichern = handleSubmit(async (input) => {
    setBusy(true);
    const result = id ? await updateAuftragAction({ id, input }) : await createAuftragAction(input);
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die markierten Felder.");
    if (!id && result.data && "id" in result.data) {
      toast.success("Auftrag angelegt. Er beginnt als Angebot.");
      return router.replace(`/admin/auftraege/${result.data.id}` as never);
    }
    reset(input);
    toast.success("Gespeichert.");
    router.refresh();
  });

  const loeschen = async () => {
    if (!id) return;
    const result = await deleteAuftragAction({ id });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Auftrag gelöscht.");
    router.push("/admin/auftraege" as never);
  };

  const invalid = [
    ...new Set(
      Object.keys(formState.errors).map((k) =>
        ["betragNetto", "leistungVon", "leistungBis"].includes(k)
          ? "umfang"
          : k === "notizen"
            ? "notizen"
            : "auftrag",
      ),
    ),
  ];

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={speichern} noValidate>
        <EditorShell
          backHref="/admin/auftraege"
          backLabel="Aufträge"
          title={id ? auftrag.titel || "Auftrag" : "Neuer Auftrag"}
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          onDelete={id ? loeschen : undefined}
          deleteLabel="Auftrag löschen"
          deleteDescription="Nur Angebote und stornierte Aufträge ohne Rechnung lassen sich löschen."
          actions={
            <Button type="submit" size="sm" disabled={busy || (Boolean(id) && !formState.isDirty)}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              {id ? "Speichern" : "Auftrag anlegen"}
            </Button>
          }
          aside={seite}
          asideAlways
        >
          <SectionCard
            section={SECTIONS[0]!}
            description={`${nummer ? `Auftragsnummer ${nummer}. ` : ""}Für wen, und was genau.`}
          >
            <KundenWahl
              control={control}
              name="kundeId"
              kunden={kundenListe}
              onNeu={(k) => setKundenListe((liste) => [...liste, k])}
            />
            <TextField
              control={control}
              name="titel"
              label="Titel"
              placeholder="Kundenportal für den Außendienst"
            />
            <TextField
              control={control}
              name="beschreibung"
              label="Beschreibung"
              multiline
              rows={6}
              description="Umfang, Ziele, was ausdrücklich nicht dazugehört."
            />
          </SectionCard>
          <SectionCard
            section={SECTIONS[1]!}
            description="Der vereinbarte Preis und wann geleistet wird; die Rechnung übernimmt beides."
          >
            <div className="max-w-64">
              <ZahlFeld control={control} name="betragNetto" label="Betrag netto" einheit="€" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DatumFeld control={control} name="leistungVon" label="Leistung ab" />
              <DatumFeld control={control} name="leistungBis" label="Leistung bis" />
            </div>
          </SectionCard>
          <SectionCard section={SECTIONS[2]!} description="Nur für Sie.">
            <TextField
              control={control}
              name="notizen"
              label="Notizen"
              multiline
              rows={4}
              hideLabel
            />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
