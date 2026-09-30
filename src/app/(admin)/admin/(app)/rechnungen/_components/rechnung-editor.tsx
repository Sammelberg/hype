"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon, CircleCheckIcon, SaveIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { euro, positionNetto } from "@/buero/logik/geld";
import { pruefeRechnung } from "@/buero/logik/pflichtangaben";
import type { AuftragOption } from "@/buero/daten/auftraege";
import type { KundeOption } from "@/buero/daten/kunden";
import type { VertragOption } from "@/buero/daten/vertraege";
import {
  EINHEITEN,
  type Firma,
  type Position,
  type RechnungInput,
  RechnungSchema,
} from "@/buero/logik/typen";
import {
  createRechnungAction,
  deleteRechnungAction,
  saveRechnungAction,
  stelleRechnungAction,
} from "../../../_actions/buero";
import { AuswahlFeld, DatumFeld, ZahlFeld } from "../../../_components/buero/felder";
import { KundenWahl } from "../../../_components/buero/kunden-wahl";
import { RechnungsDokument } from "../../../_components/buero/rechnungs-dokument";
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
  { id: "kunde", title: "Kunde und Bezug" },
  { id: "positionen", title: "Positionen" },
  { id: "leistung", title: "Leistung und Zahlung" },
  { id: "texte", title: "Texte" },
];

const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

// A draft invoice: the fields on the left, the invoice as it will look on the right, and what
// is still missing before it can be issued. Issuing saves what is on screen and freezes it.
export function RechnungEditor({
  id,
  rechnung,
  firma,
  kunden,
  auftraege,
  vertraege,
}: {
  id: number | null;
  rechnung: RechnungInput;
  firma: Firma;
  kunden: KundeOption[];
  auftraege: AuftragOption[];
  vertraege: VertragOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"speichern" | "stellen" | null>(null);
  const [kundenListe, setKundenListe] = useState(kunden);
  const form = useForm({
    resolver: zodResolver(RechnungSchema),
    defaultValues: rechnung,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, getValues, setValue } = form;
  const werte = useWatch({ control }) as Partial<RechnungInput>;
  const positionen = (werte.positionen ?? []).map((p) => ({
    bezeichnung: p?.bezeichnung ?? "",
    menge: Number(p?.menge ?? 0),
    einheit: p?.einheit ?? "HUR",
    einzelpreis: Number(p?.einzelpreis ?? 0),
    ustSatz: Number(p?.ustSatz ?? 19),
  }));
  const kunde = kundenListe.find((k) => k.id === werte.kundeId) ?? null;
  const auftrag = auftraege.find((a) => a.id === werte.auftragId) ?? null;
  const vertrag = vertraege.find((v) => v.id === werte.vertragId) ?? null;
  const dirty = { shouldDirty: true } as const;

  // One document follows the other: a chosen order or contract brings its customer; a new
  // customer lets go of another customer's order and contract and brings their payment terms.
  const kundeGewaehlt = (k: KundeOption | null) => {
    const a = auftraege.find((x) => x.id === getValues("auftragId"));
    if (a && a.kundeId !== k?.id) setValue("auftragId", null, dirty);
    const v = vertraege.find((x) => x.id === getValues("vertragId"));
    if (v && v.kundeId !== k?.id) setValue("vertragId", null, dirty);
    if (k?.zahlungszielTage != null) setValue("zahlungszielTage", k.zahlungszielTage, dirty);
  };
  const kundeVon = (kundeId: number | undefined) => {
    if (kundeId && kundeId !== getValues("kundeId")) {
      setValue("kundeId", kundeId, dirty);
      kundeGewaehlt(kundenListe.find((k) => k.id === kundeId) ?? null);
    }
  };

  // Takes a position over from the order or the contract: into an empty draft it replaces the
  // blank line, otherwise it is added.
  const uebernehmen = (neu: Omit<Position, "id">, von?: string | null, bis?: string | null) => {
    const jetzt = getValues("positionen") ?? [];
    const leer = jetzt.length === 1 && !jetzt[0]?.bezeichnung && !Number(jetzt[0]?.einzelpreis);
    const position = { id: newId(), ...neu };
    setValue("positionen", leer ? [position] : [...jetzt, position], dirty);
    if (von && !getValues("leistungVon")) setValue("leistungVon", von, dirty);
    if (bis && !getValues("leistungBis")) setValue("leistungBis", bis, dirty);
    toast.success("Übernommen. Prüfen Sie Menge und Preis.");
  };
  const pruefung = pruefeRechnung({
    firma,
    empfaenger: kunde?.empfaenger ?? null,
    positionen,
    leistungVon: werte.leistungVon ?? null,
    leistungBis: werte.leistungBis ?? null,
  });

  // True when the action failed; the toast says why.
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
    const result = id ? await saveRechnungAction({ id, input }) : await createRechnungAction(input);
    setBusy(null);
    if (fehler(result)) return;
    if (!id && result.data && "id" in result.data) {
      toast.success("Entwurf angelegt.");
      return router.replace(`/admin/rechnungen/${result.data.id}` as never);
    }
    reset(input);
    toast.success("Entwurf gespeichert.");
    router.refresh();
  });

  const stellen = handleSubmit(async (input) => {
    if (!id) return;
    setBusy("stellen");
    const result = await stelleRechnungAction({ id, input });
    setBusy(null);
    if (fehler(result)) return;
    toast.success(`Rechnung ${result.data?.nummer ?? ""} gestellt.`);
    router.refresh();
  });

  const loeschen = async () => {
    if (!id) return;
    const result = await deleteRechnungAction({ id });
    if (fehler(result)) return;
    toast.success("Entwurf gelöscht.");
    router.push("/admin/rechnungen" as never);
  };

  const invalid = [
    ...new Set(
      Object.keys(formState.errors).map((k) =>
        k === "positionen"
          ? "positionen"
          : ["leistungVon", "leistungBis", "zahlungszielTage"].includes(k)
            ? "leistung"
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
          backHref="/admin/rechnungen"
          backLabel="Rechnungen"
          title={id ? "Rechnungsentwurf" : "Neue Rechnung"}
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          onDelete={id ? loeschen : undefined}
          deleteLabel="Entwurf löschen"
          deleteDescription="Der Entwurf hat noch keine Nummer; er verschwindet ohne Spur."
          actions={
            <>
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
              {id ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy !== null || pruefung.stellen.length > 0}
                    >
                      {busy === "stellen" ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <SendIcon data-icon="inline-start" />
                      )}
                      Rechnung stellen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rechnung stellen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sie bekommt die nächste Rechnungsnummer und das heutige Datum und ist danach
                        festgeschrieben: ändern lässt sie sich nur noch mit einem Storno.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void stellen()}>
                        Rechnung stellen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </>
          }
          asideAlways
          aside={
            <div className="flex flex-col gap-6 xl:sticky xl:top-36">
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {pruefung.stellen.length === 0 ? (
                      <CircleCheckIcon aria-hidden="true" className="text-success size-4" />
                    ) : (
                      <CircleAlertIcon aria-hidden="true" className="text-warning size-4" />
                    )}
                    {pruefung.stellen.length === 0
                      ? "Bereit zum Stellen"
                      : "Noch nicht vollständig"}
                  </CardTitle>
                  <CardDescription>
                    {pruefung.stellen.length === 0
                      ? pruefung.xrechnung.length === 0
                        ? "Alle Pflichtangaben sind da, auch für die E-Rechnung."
                        : "Die Rechnung lässt sich stellen und drucken; als E-Rechnung fehlt noch etwas."
                      : "Diese Angaben verlangt §14 UStG, bevor die Rechnung gestellt wird."}
                  </CardDescription>
                </CardHeader>
                {pruefung.stellen.length + pruefung.xrechnung.length > 0 ? (
                  <CardContent className="flex flex-col gap-1 text-sm">
                    <ul className="flex flex-col gap-1">
                      {[...pruefung.stellen, ...pruefung.xrechnung].map((m) => (
                        <li key={m.text}>
                          {m.text} <span className="text-muted-foreground">({m.norm})</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-muted-foreground">
                      Angaben des Unternehmens ergänzen Sie unter{" "}
                      <Link href={"/admin/firma" as never} className="underline underline-offset-2">
                        Firmendaten
                      </Link>
                      {kunde ? (
                        <>
                          , die des Kunden in seiner{" "}
                          <Link
                            href={`/admin/kunden/${kunde.id}` as never}
                            className="underline underline-offset-2"
                          >
                            Kundenkarte
                          </Link>
                        </>
                      ) : null}
                      .
                    </p>
                  </CardContent>
                ) : null}
              </Card>
              <section
                aria-label="Vorschau der Rechnung"
                className="rounded-xl border bg-muted/50 p-3"
              >
                <RechnungsDokument
                  daten={{
                    nummer: null,
                    storno: false,
                    ausgestelltAm: null,
                    faelligAm: null,
                    leistungVon: werte.leistungVon ?? null,
                    leistungBis: werte.leistungBis ?? null,
                    verkaeufer: firma,
                    empfaenger: kunde?.empfaenger ?? null,
                    kundennummer: kunde?.nummer ?? null,
                    kleinunternehmer: firma.kleinunternehmer,
                    einleitung: werte.einleitung ?? null,
                    schlusstext: werte.schlusstext ?? null,
                    positionen,
                  }}
                />
              </section>
            </div>
          }
        >
          <SectionCard
            section={SECTIONS[0]!}
            description="An wen die Rechnung geht und wozu sie gehört."
          >
            <KundenWahl
              control={control}
              name="kundeId"
              kunden={kundenListe}
              onNeu={(k) => setKundenListe((liste) => [...liste, k])}
              onWahl={kundeGewaehlt}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <AuswahlFeld
                control={control}
                name="auftragId"
                label="Zum Auftrag"
                zahl
                leer="Ohne Auftrag"
                optionen={auftraege
                  .filter((a) => !werte.kundeId || a.kundeId === werte.kundeId)
                  .map((a) => ({ value: String(a.id), label: `${a.titel} (${a.nummer})` }))}
                onAuswahl={(wert) => kundeVon(auftraege.find((x) => x.id === wert)?.kundeId)}
              />
              <AuswahlFeld
                control={control}
                name="vertragId"
                label="Zum Vertrag"
                zahl
                leer="Ohne Vertrag"
                optionen={vertraege
                  .filter((v) => !werte.kundeId || v.kundeId === werte.kundeId)
                  .map((v) => ({ value: String(v.id), label: `${v.titel} (${v.nummer})` }))}
                onAuswahl={(wert) => kundeVon(vertraege.find((x) => x.id === wert)?.kundeId)}
              />
            </div>
          </SectionCard>

          <SectionCard
            section={SECTIONS[1]!}
            action={
              <>
                {auftrag ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      uebernehmen(
                        {
                          bezeichnung: auftrag.titel,
                          menge: 1,
                          einheit: "LS",
                          einzelpreis: auftrag.betragNetto ?? 0,
                          ustSatz: 19,
                        },
                        auftrag.leistungVon,
                        auftrag.leistungBis,
                      )
                    }
                  >
                    Aus Auftrag übernehmen
                  </Button>
                ) : null}
                {vertrag?.verguetungNetto ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      uebernehmen({
                        bezeichnung: vertrag.titel,
                        menge: 1,
                        einheit: vertrag.verguetungIntervall === "monatlich" ? "MON" : "LS",
                        einzelpreis: vertrag.verguetungNetto ?? 0,
                        ustSatz: 19,
                      })
                    }
                  >
                    Vergütung übernehmen
                  </Button>
                ) : null}
              </>
            }
            description={
              firma.kleinunternehmer
                ? "Menge und Art jeder Leistung. Als Kleinunternehmer ohne Umsatzsteuer."
                : "Menge und Art jeder Leistung; die Umsatzsteuer wird je Satz einmal berechnet."
            }
          >
            <ItemCards
              control={control}
              name="positionen"
              itemLabel={(i) => positionen[i]?.bezeichnung || `Position ${i + 1}`}
              addLabel="Position hinzufügen"
              min={1}
              // A short invoice shows its positions open; an empty one always.
              anfangsOffen={(i) =>
                rechnung.positionen.length <= 3 || !rechnung.positionen[i]?.bezeichnung
              }
              summary={(i) => (
                <span className="flex min-w-0 items-baseline justify-between gap-3">
                  <span className="truncate font-medium">
                    {positionen[i]?.bezeichnung || "Neue Position"}
                  </span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {positionen[i] ? euro(positionNetto(positionen[i])) : ""}
                  </span>
                </span>
              )}
              make={() => ({
                id: newId(),
                bezeichnung: "",
                menge: 1,
                einheit: "HUR" as const,
                einzelpreis: 0,
                ustSatz: 19 as const,
              })}
              render={(i) => (
                <div className="grid gap-3">
                  <TextField
                    control={control}
                    name={`positionen.${i}.bezeichnung`}
                    label="Leistung"
                    multiline
                    rows={2}
                  />
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
                    <ZahlFeld
                      control={control}
                      name={`positionen.${i}.menge`}
                      label="Menge"
                      leerIstNull={false}
                    />
                    <AuswahlFeld
                      control={control}
                      name={`positionen.${i}.einheit`}
                      label="Einheit"
                      optionen={Object.entries(EINHEITEN).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                    <ZahlFeld
                      control={control}
                      name={`positionen.${i}.einzelpreis`}
                      label="Einzelpreis netto"
                      einheit="€"
                      leerIstNull={false}
                    />
                  </div>
                  {firma.kleinunternehmer ? null : (
                    <Controller
                      control={control}
                      name={`positionen.${i}.ustSatz`}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Umsatzsteuer</FieldLabel>
                          <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={String(field.value)}
                            onValueChange={(v) => v && field.onChange(Number(v))}
                            aria-label="Umsatzsteuersatz"
                            className="self-start"
                          >
                            <ToggleGroupItem value="19">19 %</ToggleGroupItem>
                            <ToggleGroupItem value="7">7 %</ToggleGroupItem>
                          </ToggleGroup>
                        </Field>
                      )}
                    />
                  )}
                </div>
              )}
            />
          </SectionCard>

          <SectionCard
            section={SECTIONS[2]!}
            description="Wann geleistet wurde (§14 Abs. 4 Nr. 6 UStG) und wie lange der Kunde Zeit hat."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DatumFeld control={control} name="leistungVon" label="Leistung vom" />
              <DatumFeld
                control={control}
                name="leistungBis"
                label="bis"
                description="Leer: an einem Tag."
              />
            </div>
            <div className="max-w-56">
              <ZahlFeld
                control={control}
                name="zahlungszielTage"
                label="Zahlungsziel"
                einheit="Tage"
                leerIstNull={false}
              />
            </div>
          </SectionCard>

          <SectionCard
            section={SECTIONS[3]!}
            description="Über und unter den Positionen; beide sind freiwillig."
          >
            <TextField
              control={control}
              name="einleitung"
              label="Einleitung"
              multiline
              rows={2}
              placeholder="Für die im September erbrachten Leistungen berechnen wir:"
            />
            <TextField
              control={control}
              name="schlusstext"
              label="Schlusstext"
              multiline
              rows={2}
              placeholder="Vielen Dank für die Zusammenarbeit."
            />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
