"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon, CircleCheckIcon, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { pruefeRechnung } from "@/buero/logik/pflichtangaben";
import { type Firma, FirmaSchema } from "@/buero/logik/typen";
import { saveFirmaAction } from "../../../_actions/buero";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { DATEV_VORGABE } from "@/buero/logik/export";
import { AuswahlFeld, SchalterFeld, ZahlFeld } from "../../../_components/buero/felder";
import { EditorShell } from "../../../_components/editor-shell";
import {
  SectionCard,
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../_components/sections";
import { TextField } from "../../../_components/text-field";

const SECTIONS: SectionInfo[] = [
  { id: "unternehmen", title: "Unternehmen" },
  { id: "steuer", title: "Steuer" },
  { id: "bank", title: "Bankverbindung" },
  { id: "kontakt", title: "Kontakt für Rechnungen" },
  { id: "rechnungen", title: "Rechnungen" },
  { id: "mahnungen", title: "Mahnungen" },
  { id: "datev", title: "Steuerberater" },
];

// A customer with everything filled, so the check below speaks only about the issuer.
const VOLLER_KUNDE = {
  name: "Kunde",
  firma: null,
  strasse: "Straße 1",
  plz: "00000",
  ort: "Ort",
  land: "DE",
  ustId: null,
  leitwegId: null,
  email: "kunde@example.com",
  privat: false,
};

// Who issues the invoices. Printed on every invoice and frozen into it when it is issued, so a
// change here reaches the next invoice, never an issued one.
export function FirmaEditor({ firma, gespeichert }: { firma: Firma; gespeichert: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const form = useForm({
    resolver: zodResolver(FirmaSchema),
    defaultValues: firma,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, setValue } = form;
  const werte = useWatch({ control }) as Firma;
  const pruefung = pruefeRechnung({
    firma: werte,
    empfaenger: VOLLER_KUNDE,
    positionen: [{ bezeichnung: "x", menge: 1, einzelpreis: 1 }],
    leistungVon: "2026-01-01",
    leistungBis: null,
  });

  const speichern = handleSubmit(async (input) => {
    setBusy(true);
    const result = await saveFirmaAction(input);
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die markierten Felder.");
    reset(input);
    toast.success("Gespeichert. Die nächste Rechnung trägt diese Angaben.");
    router.refresh();
  });

  const invalid = Object.keys(formState.errors).map((k) =>
    ["steuernummer", "ustId", "kleinunternehmer"].includes(k)
      ? "steuer"
      : ["iban", "bic", "bank"].includes(k)
        ? "bank"
        : ["telefon", "email"].includes(k)
          ? "kontakt"
          : ["zahlungszielTage", "fusszeile"].includes(k)
            ? "rechnungen"
            : k === "basiszinssatz"
              ? "mahnungen"
              : k === "datev"
                ? "datev"
                : "unternehmen",
  );

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={speichern} noValidate>
        <EditorShell
          backHref="/admin/rechnungen"
          backLabel="Rechnungen"
          title="Firmendaten"
          lead="Ihre Angaben als Rechnungssteller – stehen auf jeder Rechnung."
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          actions={
            <Button type="submit" size="sm" disabled={busy || (gespeichert && !formState.isDirty)}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              Speichern
            </Button>
          }
          asideAlways
          aside={
            <Card className="xl:sticky xl:top-36">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {pruefung.stellen.length + pruefung.xrechnung.length === 0 ? (
                    <CircleCheckIcon aria-hidden="true" className="text-success size-4" />
                  ) : (
                    <CircleAlertIcon aria-hidden="true" className="text-warning size-4" />
                  )}
                  Bereit für Rechnungen?
                </CardTitle>
                <CardDescription>
                  {pruefung.stellen.length + pruefung.xrechnung.length === 0
                    ? "Alles da: Rechnungen und E-Rechnungen (XRechnung) lassen sich stellen."
                    : "Was Ihren Rechnungen noch fehlt, mit der Vorschrift dahinter."}
                </CardDescription>
              </CardHeader>
              {pruefung.stellen.length + pruefung.xrechnung.length > 0 ? (
                <CardContent className="flex flex-col gap-4 text-sm">
                  {pruefung.stellen.length > 0 ? (
                    <div>
                      <p className="font-medium">Ohne diese Angaben keine Rechnung</p>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {pruefung.stellen.map((m) => (
                          <li key={m.text}>
                            {m.text} <span className="text-muted-foreground">({m.norm})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {pruefung.xrechnung.length > 0 ? (
                    <div>
                      <p className="font-medium">Ohne diese Angaben keine E-Rechnung</p>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {pruefung.xrechnung.map((m) => (
                          <li key={m.text}>
                            {m.text} <span className="text-muted-foreground">({m.norm})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              ) : null}
            </Card>
          }
        >
          {gespeichert ? null : (
            <p className="text-sm text-pretty text-muted-foreground">
              Vorgeschlagen aus den Angaben der Website. Prüfen Sie sie und ergänzen Sie Steuer und
              Bank; gespeichert ist noch nichts.
            </p>
          )}
          <SectionCard
            section={SECTIONS[0]!}
            description="Name und Anschrift stehen auf jeder Rechnung (§14 Abs. 4 Nr. 1 UStG)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name="name" label="Name des Unternehmens" />
              <TextField control={control} name="inhaber" label="Inhaber" />
            </div>
            <TextField control={control} name="strasse" label="Straße und Hausnummer" />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)]">
              <TextField control={control} name="plz" label="PLZ" />
              <TextField control={control} name="ort" label="Ort" />
            </div>
          </SectionCard>

          <SectionCard
            section={SECTIONS[1]!}
            description="Eine der beiden Nummern muss auf der Rechnung stehen (§14 Abs. 4 Nr. 2 UStG)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name="steuernummer" label="Steuernummer" />
              <TextField control={control} name="ustId" label="USt-IdNr" />
            </div>
            <SchalterFeld
              control={control}
              name="kleinunternehmer"
              label="Kleinunternehmer nach §19 UStG"
              description="Rechnungen ohne Umsatzsteuer, mit dem gesetzlichen Hinweis. Kleinunternehmer müssen keine E-Rechnung ausstellen, dürfen es aber."
            />
          </SectionCard>

          <SectionCard
            section={SECTIONS[2]!}
            description="Steht unter jeder Rechnung; die E-Rechnung braucht die IBAN für die Überweisung."
          >
            <TextField control={control} name="iban" label="IBAN" inputClassName="font-mono" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name="bic" label="BIC" inputClassName="font-mono" />
              <TextField control={control} name="bank" label="Bank" />
            </div>
          </SectionCard>

          <SectionCard
            section={SECTIONS[3]!}
            description="Die E-Rechnung verlangt Telefon und E-Mail des Rechnungsstellers (XRechnung BR-DE-5 bis 7)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name="telefon" label="Telefon" />
              <TextField control={control} name="email" label="E-Mail für Rechnungen" />
            </div>
          </SectionCard>

          <SectionCard
            section={SECTIONS[4]!}
            description="Vorgaben für neue Rechnungen; jede Rechnung kann sie ändern."
          >
            <div className="max-w-56">
              <ZahlFeld
                control={control}
                name="zahlungszielTage"
                label="Zahlungsziel"
                einheit="Tage"
                leerIstNull={false}
              />
            </div>
            <TextField
              control={control}
              name="fusszeile"
              label="Zusatz im Fußbereich"
              multiline
              rows={2}
              description="Etwa ein Hinweis auf Ihre Website. Pflichtangaben stehen dort schon."
            />
          </SectionCard>

          <SectionCard
            section={SECTIONS[5]!}
            description="Verzugszinsen rechnen mit dem Basiszinssatz nach §247 BGB. Die Bundesbank veröffentlicht ihn zum 1. Januar und 1. Juli; tragen Sie den jeweils geltenden ein."
          >
            <div className="max-w-56">
              <ZahlFeld
                control={control}
                name="basiszinssatz"
                label="Basiszinssatz"
                einheit="%"
                description="Leer: Mahnungen schlagen keine Zinsen vor."
              />
            </div>
          </SectionCard>

          <SectionCard
            section={SECTIONS[6]!}
            description="Für den DATEV-Buchungsstapel unter Steuerberater. Die Nummern und Konten nennt Ihnen Ihre Kanzlei."
          >
            <Field orientation="horizontal" className="items-start">
              <Switch
                id="datev-an"
                checked={Boolean(werte.datev)}
                onCheckedChange={(an) =>
                  setValue(
                    "datev",
                    an
                      ? {
                          beraternummer: 0,
                          mandantennummer: 0,
                          kontenrahmen: "03",
                          sachkontenlaenge: 4,
                          ...DATEV_VORGABE["03"],
                        }
                      : null,
                    { shouldDirty: true },
                  )
                }
              />
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="datev-an">DATEV-Export einrichten</FieldLabel>
                <FieldDescription>
                  Rechnungsausgangsbuch und Umsatzsteuer gibt es auch ohne.
                </FieldDescription>
              </div>
            </Field>
            {werte.datev ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ZahlFeld
                    control={control}
                    name="datev.beraternummer"
                    label="Beraternummer"
                    leerIstNull={false}
                  />
                  <ZahlFeld
                    control={control}
                    name="datev.mandantennummer"
                    label="Mandantennummer"
                    leerIstNull={false}
                  />
                  <AuswahlFeld
                    control={control}
                    name="datev.kontenrahmen"
                    label="Kontenrahmen"
                    optionen={[
                      { value: "03", label: "SKR 03" },
                      { value: "04", label: "SKR 04" },
                    ]}
                    onAuswahl={(wert) => {
                      const vorgabe = DATEV_VORGABE[wert === "04" ? "04" : "03"];
                      for (const [k, v] of Object.entries(vorgabe))
                        setValue(`datev.${k as keyof typeof vorgabe}`, v, { shouldDirty: true });
                    }}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  <ZahlFeld
                    control={control}
                    name="datev.debitor"
                    label="Debitor"
                    leerIstNull={false}
                    description="Sammelkonto der Kunden."
                  />
                  <ZahlFeld
                    control={control}
                    name="datev.erloes19"
                    label="Erlöse 19 %"
                    leerIstNull={false}
                  />
                  <ZahlFeld
                    control={control}
                    name="datev.erloes7"
                    label="Erlöse 7 %"
                    leerIstNull={false}
                  />
                  <ZahlFeld
                    control={control}
                    name="datev.erloes0"
                    label="Erlöse §19"
                    leerIstNull={false}
                  />
                </div>
                <div className="max-w-56">
                  <ZahlFeld
                    control={control}
                    name="datev.sachkontenlaenge"
                    label="Sachkontenlänge"
                    einheit="Stellen"
                    leerIstNull={false}
                  />
                </div>
              </>
            ) : null}
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
