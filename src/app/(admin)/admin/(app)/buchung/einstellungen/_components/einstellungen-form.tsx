"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EinstellungenSchema, type EinstellungenInput } from "@/buchung/logik/schemas";
import { speichereEinstellungenAction } from "../../../../_actions/buchung";
import { ZahlFeld } from "../../../../_components/buero/felder";
import { useSpeichern } from "../../../../_components/buchung/speichern";
import { EditorShell } from "../../../../_components/editor-shell";
import { SectionCard, SectionFocusProvider } from "../../../../_components/sections";
import { TextField } from "../../../../_components/text-field";

// The rules the booking engine works by. A change applies to new bookings; booked ones keep
// the Fenster and price they were made with.
export function EinstellungenForm({ werte }: { werte: EinstellungenInput }) {
  const { busy, speichern } = useSpeichern("/admin/buchung/einstellungen");
  const form = useForm({
    resolver: zodResolver(EinstellungenSchema),
    defaultValues: werte,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset, setError } = form;

  const absenden = handleSubmit((input) =>
    speichern(() => speichereEinstellungenAction(input), {
      feldFehler: (feld, message) => setError(feld as keyof EinstellungenInput, { message }),
      gespeichert: () => reset(input),
    }),
  );

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={absenden} noValidate>
        <EditorShell
          backHref="/admin"
          backLabel="Übersicht"
          title="Buchungsregeln"
          lead="Gilt für neue Buchungen; gebuchte behalten Zeitfenster und Preis."
          actions={
            <Button type="submit" size="sm" disabled={busy || !formState.isDirty}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              Speichern
            </Button>
          }
        >
          <SectionCard
            section={{ id: "zeiten", title: "Angebotene Zeiten" }}
            description="Die Website bietet Beginne in diesem Raster an, nach deutscher Uhrzeit."
          >
            <div className="grid gap-6 sm:grid-cols-3">
              <TextField control={control} name="ersterStart" label="Erster Beginn" maxLength={5} />
              <TextField
                control={control}
                name="letzterStart"
                label="Letzter Beginn"
                maxLength={5}
              />
              <ZahlFeld
                control={control}
                name="rasterMin"
                label="Raster"
                einheit="Minuten"
                leerIstNull={false}
              />
            </div>
          </SectionCard>

          <SectionCard
            section={{ id: "fenster", title: "Zeit rund um die Feier" }}
            description="Zusammen mit der Fahrzeit der Zone ist der Darsteller so lange belegt."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <ZahlFeld
                control={control}
                name="vorbereitungMin"
                label="Umziehen und Aufbau"
                einheit="Minuten"
                leerIstNull={false}
              />
              <ZahlFeld
                control={control}
                name="abbauMin"
                label="Abbau"
                einheit="Minuten"
                leerIstNull={false}
              />
            </div>
          </SectionCard>

          <SectionCard
            section={{ id: "zahlung", title: "Anzahlung und Reservierung" }}
            description="Die Anzahlung macht aus der Reservierung eine Buchung. Unbezahlt wird der Termin nach der Frist wieder frei."
          >
            <div className="grid gap-6 sm:grid-cols-3">
              <ZahlFeld
                control={control}
                name="anzahlungProzent"
                label="Anzahlung"
                einheit="%"
                leerIstNull={false}
              />
              <ZahlFeld
                control={control}
                name="haltenMin"
                label="Reservierung"
                einheit="Minuten"
                leerIstNull={false}
              />
              <ZahlFeld
                control={control}
                name="haltenLastschriftMin"
                label="Bei Lastschrift"
                einheit="Minuten"
                description="Eine Lastschrift braucht Tage."
                leerIstNull={false}
              />
            </div>
          </SectionCard>

          <SectionCard
            section={{ id: "vorlauf", title: "Kurzfristige Buchungen" }}
            description="Näher am Termin wird aus der Buchung eine Anfrage, die Sie bestätigen."
          >
            <ZahlFeld
              control={control}
              name="mindestVorlaufStd"
              label="Mindestvorlauf"
              einheit="Stunden"
              leerIstNull={false}
            />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
