"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { datumDe, heute, naechstesVertragsende } from "@/buero/logik/ablauf";
import { INTERVALLE, VERTRAGSARTEN, type VertragInput, VertragSchema } from "@/buero/logik/typen";
import {
  createVertragAction,
  deleteVertragAction,
  updateVertragAction,
} from "../../../_actions/buero";
import type { KundeOption } from "@/buero/daten/kunden";
import { AuswahlFeld, DatumFeld, SchalterFeld, ZahlFeld } from "../../../_components/buero/felder";
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
  { id: "vertrag", title: "Vertrag" },
  { id: "laufzeit", title: "Laufzeit und Kündigung" },
  { id: "verguetung", title: "Vergütung" },
  { id: "inhalt", title: "Vereinbarungen" },
];
const SECTION_OF: Record<string, string> = {
  beginn: "laufzeit",
  laufzeitMonate: "laufzeit",
  verlaengerungMonate: "laufzeit",
  kuendigungsfristMonate: "laufzeit",
  unterzeichnetAm: "laufzeit",
  verguetungNetto: "verguetung",
  verguetungIntervall: "verguetung",
  aboRechnungen: "verguetung",
  inhalt: "inhalt",
};

// A sentence for the term as entered, so the owner reads what the numbers mean.
function laufzeitText(v: Partial<VertragInput>) {
  if (!v.beginn) return "Mit dem Beginn lässt sich das Vertragsende berechnen.";
  const frist = Number(v.kuendigungsfristMonate ?? 0);
  const ende = naechstesVertragsende(
    {
      beginn: v.beginn,
      laufzeitMonate: v.laufzeitMonate ? Number(v.laufzeitMonate) : null,
      verlaengerungMonate: v.verlaengerungMonate ? Number(v.verlaengerungMonate) : null,
      kuendigungsfristMonate: frist,
    },
    heute() > v.beginn ? heute() : v.beginn,
  );
  if (!v.laufzeitMonate)
    return `Unbefristet. Mit ${frist} Monaten Frist endet er frühestens am ${datumDe(ende.ende)}, wenn heute gekündigt wird.`;
  return ende.kuendigenBis
    ? `Nächstes Ende ${datumDe(ende.ende)}; die Kündigung muss bis ${datumDe(ende.kuendigenBis)} zugehen${v.verlaengerungMonate ? `, sonst verlängert er sich um ${v.verlaengerungMonate} Monate` : ""}.`
    : `Endet von selbst am ${datumDe(ende.ende)}.`;
}

export function VertragEditor({
  id,
  nummer,
  vertrag,
  kunden,
  auftraege,
  gesperrt = false,
  seite,
}: {
  id: number | null;
  nummer?: string;
  vertrag: VertragInput;
  kunden: KundeOption[];
  auftraege: { id: number; nummer: string; titel: string; kundeId: number }[];
  gesperrt?: boolean;
  seite?: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [kundenListe, setKundenListe] = useState(kunden);
  const form = useForm({
    resolver: zodResolver(VertragSchema),
    defaultValues: vertrag,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, getValues, setValue } = form;
  const werte = useWatch({ control }) as Partial<VertragInput>;

  const speichern = handleSubmit(async (input) => {
    setBusy(true);
    const result = id ? await updateVertragAction({ id, input }) : await createVertragAction(input);
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die markierten Felder.");
    if (!id && result.data && "id" in result.data) {
      toast.success("Vertrag angelegt. Er ist ein Entwurf, bis er unterzeichnet ist.");
      return router.replace(`/admin/vertraege/${result.data.id}` as never);
    }
    reset(input);
    toast.success("Gespeichert.");
    router.refresh();
  });

  const loeschen = async () => {
    if (!id) return;
    const result = await deleteVertragAction({ id });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Vertrag gelöscht.");
    router.push("/admin/vertraege" as never);
  };

  const invalid = [
    ...new Set(Object.keys(formState.errors).map((k) => SECTION_OF[k] ?? "vertrag")),
  ];
  const passendeAuftraege = auftraege.filter((a) => !werte.kundeId || a.kundeId === werte.kundeId);

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={speichern} noValidate>
        <EditorShell
          backHref="/admin/vertraege"
          backLabel="Verträge"
          title={id ? vertrag.titel || "Vertrag" : "Neuer Vertrag"}
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          onDelete={id ? loeschen : undefined}
          deleteLabel="Vertrag löschen"
          deleteDescription="Nur Entwürfe ohne Rechnung lassen sich löschen; alle anderen werden beendet."
          actions={
            gesperrt ? null : (
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
                {id ? "Speichern" : "Vertrag anlegen"}
              </Button>
            )
          }
          aside={seite}
          asideAlways
        >
          <fieldset disabled={gesperrt} className="contents">
            <SectionCard
              section={SECTIONS[0]!}
              description={`${nummer ? `Vertragsnummer ${nummer}. ` : ""}Mit wem, welcher Art, zu welchem Auftrag.`}
            >
              <KundenWahl
                control={control}
                name="kundeId"
                kunden={kundenListe}
                onNeu={(k) => setKundenListe((liste) => [...liste, k])}
                // An order of another customer does not stay attached.
                onWahl={(k) => {
                  const a = auftraege.find((x) => x.id === getValues("auftragId"));
                  if (a && a.kundeId !== k?.id) setValue("auftragId", null, { shouldDirty: true });
                }}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <AuswahlFeld
                  control={control}
                  name="art"
                  label="Art"
                  optionen={Object.entries(VERTRAGSARTEN).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
                <AuswahlFeld
                  control={control}
                  name="auftragId"
                  label="Zum Auftrag"
                  zahl
                  leer="Ohne Auftrag"
                  optionen={passendeAuftraege.map((a) => ({
                    value: String(a.id),
                    label: `${a.titel} (${a.nummer})`,
                  }))}
                  onAuswahl={(wert) => {
                    // Choosing the order chooses its customer.
                    const a = auftraege.find((x) => x.id === wert);
                    if (a && a.kundeId !== getValues("kundeId"))
                      setValue("kundeId", a.kundeId, { shouldDirty: true });
                  }}
                />
              </div>
              <TextField
                control={control}
                name="titel"
                label="Titel"
                placeholder="Wartung und Betrieb Kundenportal"
              />
            </SectionCard>

            <SectionCard section={SECTIONS[1]!} description={laufzeitText(werte)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <DatumFeld control={control} name="beginn" label="Beginn" />
                <DatumFeld control={control} name="unterzeichnetAm" label="Unterzeichnet am" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <ZahlFeld
                  control={control}
                  name="laufzeitMonate"
                  label="Mindestlaufzeit"
                  einheit="Monate"
                  description="Leer: unbefristet."
                />
                <ZahlFeld
                  control={control}
                  name="verlaengerungMonate"
                  label="Verlängerung"
                  einheit="Monate"
                  description="Leer: endet danach."
                />
                <ZahlFeld
                  control={control}
                  name="kuendigungsfristMonate"
                  label="Kündigungsfrist"
                  einheit="Monate"
                  leerIstNull={false}
                />
              </div>
            </SectionCard>

            <SectionCard
              section={SECTIONS[2]!}
              description="Was der Kunde zahlt und wie oft; die Rechnung übernimmt es."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ZahlFeld
                  control={control}
                  name="verguetungNetto"
                  label="Betrag netto"
                  einheit="€"
                />
                <AuswahlFeld
                  control={control}
                  name="verguetungIntervall"
                  label="Abrechnung"
                  leer="Nicht festgelegt"
                  optionen={Object.entries(INTERVALLE).map(([value, label]) => ({ value, label }))}
                />
              </div>
              {werte.verguetungIntervall && werte.verguetungIntervall !== "einmalig" ? (
                <SchalterFeld
                  control={control}
                  name="aboRechnungen"
                  label="Laufende Rechnungen vorbereiten"
                  description="Zu Beginn jedes Zeitraums liegt ein Rechnungsentwurf bereit, im Voraus berechnet. Sie prüfen und stellen ihn."
                />
              ) : null}
            </SectionCard>

            <SectionCard
              section={SECTIONS[3]!}
              description="Leistungsumfang, Reaktionszeiten, Besonderheiten; der unterschriebene Vertrag selbst liegt bei Ihren Unterlagen."
            >
              <TextField
                control={control}
                name="inhalt"
                label="Vereinbarungen"
                multiline
                rows={8}
                hideLabel
              />
            </SectionCard>
          </fieldset>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
