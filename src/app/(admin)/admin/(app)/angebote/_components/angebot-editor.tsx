"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, PrinterIcon, SaveIcon, SendIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { AuftragOption } from "@/buero/daten/auftraege";
import type { KundeOption } from "@/buero/daten/kunden";
import { datumDe } from "@/buero/logik/ablauf";
import { euro, rechnungsSummen } from "@/buero/logik/geld";
import { type AngebotInput, AngebotSchema, type Firma } from "@/buero/logik/typen";
import {
  createAngebotAction,
  deleteAngebotAction,
  lehneAngebotAbAction,
  nimmAngebotAnAction,
  saveAngebotAction,
  versendeAngebotAction,
} from "../../../_actions/angebote";
import { AuswahlFeld, DatumFeld } from "../../../_components/buero/felder";
import { KundenWahl } from "../../../_components/buero/kunden-wahl";
import { PositionenListe, positionenAusWerten } from "../../../_components/buero/positionen";
import { RechnungsDokument } from "../../../_components/buero/rechnungs-dokument";
import { AngebotStatus } from "../../../_components/buero/status";
import { EditorShell } from "../../../_components/editor-shell";
import {
  SectionCard,
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../_components/sections";
import { TextField } from "../../../_components/text-field";

const SECTIONS: SectionInfo[] = [
  { id: "kunde", title: "Kunde und Auftrag" },
  { id: "positionen", title: "Positionen" },
  { id: "gueltigkeit", title: "Gültigkeit" },
  { id: "texte", title: "Texte" },
];

type Stand = {
  status: "entwurf" | "versendet" | "angenommen" | "abgelehnt";
  nummer: string | null;
  versendetAm: string | null;
  auftragId: number | null;
};

// An offer: the fields on the left, the offer as the customer will read it on the right. Sending
// saves what is on screen and gives it its number; the customer's answer is recorded here too.
export function AngebotEditor({
  id,
  angebot,
  stand,
  firma,
  kunden,
  auftraege,
  heute,
}: {
  id: number | null;
  angebot: AngebotInput;
  stand: Stand;
  firma: Firma;
  kunden: KundeOption[];
  auftraege: AuftragOption[];
  heute: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [kundenListe, setKundenListe] = useState(kunden);
  const form = useForm({
    resolver: zodResolver(AngebotSchema),
    defaultValues: angebot,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, setValue, getValues } = form;
  const werte = useWatch({ control }) as Partial<AngebotInput>;
  const positionen = positionenAusWerten(werte.positionen);
  const kunde = kundenListe.find((k) => k.id === werte.kundeId) ?? null;
  const gesperrt = stand.status === "angenommen";
  const summen = rechnungsSummen(positionen, firma.kleinunternehmer);
  const abgelaufen =
    stand.status === "versendet" && Boolean(werte.gueltigBis && werte.gueltigBis < heute);

  const fehler = (result: { serverError?: { message: string }; validationErrors?: unknown }) => {
    if (result.serverError) {
      toast.error(result.serverError.message);
      return true;
    }
    if (result.validationErrors) {
      toast.error("Bitte prüfen Sie die markierten Felder.");
      return true;
    }
    return false;
  };

  const speichern = handleSubmit(async (input) => {
    setBusy("speichern");
    const result = id ? await saveAngebotAction({ id, input }) : await createAngebotAction(input);
    setBusy(null);
    if (fehler(result)) return;
    if (!id && result.data && "id" in result.data) {
      toast.success("Angebot angelegt.");
      return router.replace(`/admin/angebote/${result.data.id}` as never);
    }
    reset(input);
    toast.success("Angebot gespeichert.");
    router.refresh();
  });

  const versenden = handleSubmit(async (input) => {
    if (!id) return;
    setBusy("versenden");
    const result = await versendeAngebotAction({ id, input });
    setBusy(null);
    if (fehler(result)) return;
    toast.success(`Angebot ${result.data?.nummer ?? ""} ist versendet. Drucken Sie es als PDF.`);
    router.refresh();
  });

  const annehmen = async () => {
    if (!id) return;
    setBusy("annehmen");
    const result = await nimmAngebotAnAction({ id });
    setBusy(null);
    if (fehler(result)) return;
    toast.success("Zusage erfasst; der Auftrag ist beauftragt.");
    router.push(`/admin/auftraege/${result.data!.auftragId}` as never);
  };

  const ablehnen = async () => {
    if (!id) return;
    const result = await lehneAngebotAbAction({ id });
    if (fehler(result)) return;
    toast.success("Absage erfasst.");
    router.refresh();
  };

  const loeschen = async () => {
    if (!id) return;
    const result = await deleteAngebotAction({ id });
    if (fehler(result)) return;
    toast.success("Entwurf gelöscht.");
    router.push("/admin/angebote" as never);
  };

  const invalid = [
    ...new Set(
      Object.keys(formState.errors).map((k) =>
        k === "positionen"
          ? "positionen"
          : k === "gueltigBis"
            ? "gueltigkeit"
            : ["einleitung", "schlusstext"].includes(k)
              ? "texte"
              : "kunde",
      ),
    ),
  ];

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={speichern} noValidate>
        <EditorShell
          backHref="/admin/angebote"
          backLabel="Angebote"
          title={
            stand.nummer ? `Angebot ${stand.nummer}` : id ? "Angebotsentwurf" : "Neues Angebot"
          }
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          onDelete={id && stand.status === "entwurf" ? loeschen : undefined}
          deleteLabel="Entwurf löschen"
          deleteDescription="Der Entwurf hat noch keine Nummer; er verschwindet ohne Spur."
          actions={
            <>
              {stand.nummer ? (
                <Button asChild variant="ghost" size="sm">
                  <a href={`/admin/druck/angebote/${id}`} target="_blank" rel="noopener noreferrer">
                    <PrinterIcon data-icon="inline-start" /> Drucken oder PDF
                  </a>
                </Button>
              ) : null}
              {gesperrt ? null : (
                <Button
                  type="submit"
                  variant={id ? "outline" : "default"}
                  size="sm"
                  disabled={busy !== null || (Boolean(id) && !formState.isDirty)}
                >
                  {busy === "speichern" ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <SaveIcon data-icon="inline-start" />
                  )}
                  {id ? "Speichern" : "Entwurf anlegen"}
                </Button>
              )}
              {id && (stand.status === "entwurf" || stand.status === "abgelehnt") ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" disabled={busy !== null}>
                      {busy === "versenden" ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <SendIcon data-icon="inline-start" />
                      )}
                      Versenden
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Angebot versenden?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Es bekommt {stand.nummer ? "wieder seine" : "die nächste"} Angebotsnummer
                        und das heutige Datum. Danach drucken Sie es als PDF und senden es dem
                        Kunden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void versenden()}>
                        Versenden
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
              {stand.status === "versendet" ? (
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void ablehnen()}>
                    <XIcon data-icon="inline-start" /> Absage
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy !== null || formState.isDirty}
                    onClick={() => void annehmen()}
                  >
                    {busy === "annehmen" ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <CheckIcon data-icon="inline-start" />
                    )}
                    Zusage erfassen
                  </Button>
                </>
              ) : null}
            </>
          }
          asideAlways
          aside={
            <div className="flex flex-col gap-6 xl:sticky xl:top-36">
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Stand <AngebotStatus status={stand.status} abgelaufen={abgelaufen} />
                  </CardTitle>
                  <CardDescription>
                    {stand.status === "entwurf"
                      ? "Noch nicht versendet."
                      : stand.status === "versendet"
                        ? `Versendet am ${datumDe(stand.versendetAm!)}${werte.gueltigBis ? `, gilt bis ${datumDe(werte.gueltigBis)}` : ""}.`
                        : stand.status === "angenommen"
                          ? "Angenommen; daraus ist der Auftrag geworden."
                          : "Abgelehnt. Überarbeitet lässt es sich erneut versenden."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Summe netto</span>
                    <span className="tabular-nums">{euro(summen.netto)}</span>
                  </p>
                  <p className="flex justify-between font-medium">
                    <span>Gesamt</span>
                    <span className="tabular-nums">{euro(summen.brutto)}</span>
                  </p>
                  {stand.auftragId ? (
                    <Link
                      href={`/admin/auftraege/${stand.auftragId}` as never}
                      className="mt-2 underline underline-offset-2"
                    >
                      Zum Auftrag
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
              <section
                aria-label="Vorschau des Angebots"
                className="rounded-xl border bg-muted/50 p-3"
              >
                <RechnungsDokument
                  daten={{
                    nummer: stand.nummer,
                    storno: false,
                    ausgestelltAm: stand.versendetAm,
                    faelligAm: null,
                    leistungVon: null,
                    leistungBis: null,
                    verkaeufer: firma,
                    empfaenger: kunde?.empfaenger ?? null,
                    kundennummer: kunde?.nummer ?? null,
                    kleinunternehmer: firma.kleinunternehmer,
                    einleitung: werte.einleitung ?? null,
                    schlusstext: werte.schlusstext ?? null,
                    positionen,
                    angebot: { gueltigBis: werte.gueltigBis ?? null },
                  }}
                />
              </section>
            </div>
          }
        >
          <fieldset disabled={gesperrt} className="contents">
            <SectionCard section={SECTIONS[0]!} description="An wen das Angebot geht.">
              <KundenWahl
                control={control}
                name="kundeId"
                kunden={kundenListe}
                onNeu={(k) => setKundenListe((liste) => [...liste, k])}
                onWahl={(k) => {
                  const a = auftraege.find((x) => x.id === getValues("auftragId"));
                  if (a && a.kundeId !== k?.id) setValue("auftragId", null, { shouldDirty: true });
                }}
              />
              <AuswahlFeld
                control={control}
                name="auftragId"
                label="Für den Auftrag"
                zahl
                leer="Neuer Auftrag bei Zusage"
                description="Bei Zusage wird dieser Auftrag beauftragt; ohne Wahl entsteht ein neuer."
                optionen={auftraege
                  .filter(
                    (a) =>
                      a.status === "angebot" && (!werte.kundeId || a.kundeId === werte.kundeId),
                  )
                  .map((a) => ({ value: String(a.id), label: `${a.titel} (${a.nummer})` }))}
              />
              <TextField control={control} name="titel" label="Titel" />
            </SectionCard>

            <SectionCard
              section={SECTIONS[1]!}
              description="Was angeboten wird, Menge und Preis; die Umsatzsteuer je Satz einmal."
            >
              <PositionenListe
                control={control}
                positionen={positionen}
                anfang={angebot.positionen}
                kleinunternehmer={firma.kleinunternehmer}
              />
            </SectionCard>

            <SectionCard
              section={SECTIONS[2]!}
              description="Bis wann Sie sich an das Angebot halten. Leer: ohne Frist."
            >
              <div className="max-w-64">
                <DatumFeld control={control} name="gueltigBis" label="Gültig bis" />
              </div>
            </SectionCard>

            <SectionCard section={SECTIONS[3]!} description="Über und unter den Positionen.">
              <TextField
                control={control}
                name="einleitung"
                label="Einleitung"
                multiline
                rows={3}
                placeholder="Vielen Dank für Ihre Anfrage. Gern bieten wir Ihnen an:"
              />
              <TextField
                control={control}
                name="schlusstext"
                label="Schlusstext"
                multiline
                rows={3}
                placeholder="Für Fragen zum Angebot sind wir gern für Sie da."
              />
            </SectionCard>
          </fieldset>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
