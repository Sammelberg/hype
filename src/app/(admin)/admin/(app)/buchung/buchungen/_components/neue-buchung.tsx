"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { euro } from "@/buero/logik/geld";
import { berlinTag, berlinUhrzeit } from "@/buero/logik/kalender";
import { ManuelleBuchungSchema, type ManuelleBuchungInput } from "@/buchung/logik/schemas";
import { preisAngebot } from "@/buchung/logik/preis";
import { neueBuchungAction } from "../../../../_actions/buchung";
import { AuswahlFeld, DatumFeld, ZahlFeld } from "../../../../_components/buero/felder";
import { HakenFeld, UhrzeitFeld } from "../../../../_components/buchung/felder";
import { EditorShell } from "../../../../_components/editor-shell";
import {
  SectionCard,
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../../_components/sections";
import { TextField } from "../../../../_components/text-field";

type Paket = { id: number; name: string; preisCent: number; figurenAnzahl: number };
type Extra = { id: number; name: string; preisCent: number; zusatzFigur: boolean };
type Stadt = { id: number; name: string; zone: string; aufschlagCent: number };

const SECTIONS: SectionInfo[] = [
  { id: "feier", title: "Feier" },
  { id: "kontakt", title: "Kontakt" },
  { id: "preis", title: "Preis" },
];
const SECTION_OF: Record<string, string> = {
  kontaktName: "kontakt",
  kontaktEmail: "kontakt",
  kontaktTelefon: "kontakt",
  strasse: "kontakt",
  plz: "kontakt",
  ort: "kontakt",
  zahlungsart: "preis",
};

const LEER: ManuelleBuchungInput = {
  figurId: 0,
  zweiteFigurId: null,
  paketId: 0,
  extraIds: [],
  stadtId: 0,
  tag: "",
  uhrzeit: "14:00",
  quelle: "telefon",
  zahlungsart: "rechnung",
  kontaktName: "",
  kontaktEmail: "",
  kontaktTelefon: null,
  strasse: null,
  plz: null,
  ort: null,
  kindName: null,
  kindAlter: null,
  kinderAnzahl: null,
  notizKunde: null,
};

const terminDe = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

// An order taken by phone or Instagram: the same engine as the website, but confirmed at once and
// allowed at short notice. A taken slot answers with the nearest free starts.
export function NeueBuchung({
  figuren,
  pakete,
  extras,
  staedte,
  anzahlungProzent,
  kleinunternehmer,
}: {
  figuren: { id: number; name: string }[];
  pakete: Paket[];
  extras: Extra[];
  staedte: Stadt[];
  anzahlungProzent: number;
  kleinunternehmer: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [alternativen, setAlternativen] = useState<string[] | null>(null);
  const form = useForm({
    resolver: zodResolver(ManuelleBuchungSchema),
    defaultValues: LEER,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, setError, setValue } = form;
  const [paketId, extraIds, stadtId] = useWatch({
    control,
    name: ["paketId", "extraIds", "stadtId"],
  });

  const paket = pakete.find((p) => p.id === paketId);
  const gewaehlteExtras = extras.filter((x) => extraIds.includes(x.id));
  const stadt = staedte.find((s) => s.id === stadtId);
  const zweiFiguren = paket?.figurenAnzahl === 2 || gewaehlteExtras.some((x) => x.zusatzFigur);
  const angebot =
    paket && stadt
      ? preisAngebot({
          paket: { name: paket.name, preisCent: paket.preisCent },
          zone: { name: `${stadt.name} (Zone ${stadt.zone})`, aufschlagCent: stadt.aufschlagCent },
          extras: gewaehlteExtras.map((x) => ({ name: x.name, preisCent: x.preisCent })),
          anzahlungProzent,
          kleinunternehmer,
        })
      : null;

  const absenden = handleSubmit(async (input) => {
    setBusy(true);
    setAlternativen(null);
    const result = await neueBuchungAction({
      ...input,
      zweiteFigurId: zweiFiguren ? input.zweiteFigurId : null,
    });
    setBusy(false);
    if (result?.serverError) {
      if (result.serverError.field)
        setError(result.serverError.field as keyof ManuelleBuchungInput, {
          message: result.serverError.message,
        });
      return void toast.error(result.serverError.message);
    }
    if (result?.validationErrors)
      return void toast.error("Bitte prüfen Sie die markierten Felder.");
    if (!result?.data) return;
    if (result.data.ok) {
      toast.success("Buchung angelegt und bestätigt.");
      return router.push(`/admin/buchung/buchungen/${result.data.id}` as never);
    }
    setAlternativen(result.data.alternativen);
    toast.error("Zu dieser Zeit ist niemand frei.");
  });

  const invalid = [...new Set(Object.keys(formState.errors).map((k) => SECTION_OF[k] ?? "feier"))];

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={absenden} noValidate>
        <EditorShell
          backHref="/admin/buchung/buchungen"
          backLabel="Buchungen"
          title="Neue Buchung"
          lead="Telefon oder Instagram: bestätigt sofort, sperrt den Termin auch auf der Website."
          nav={<SectionIndex sections={SECTIONS} invalid={invalid} />}
          actions={
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              Buchen
            </Button>
          }
        >
          <SectionCard section={SECTIONS[0]!}>
            <div className="grid gap-6 sm:grid-cols-2">
              <AuswahlFeld
                control={control}
                name="figurId"
                label="Figur"
                zahl
                optionen={figuren.map((f) => ({ value: String(f.id), label: f.name }))}
              />
              <AuswahlFeld
                control={control}
                name="paketId"
                label="Paket"
                zahl
                optionen={pakete.map((p) => ({
                  value: String(p.id),
                  label: `${p.name} · ${euro(p.preisCent)}`,
                }))}
              />
            </div>
            {zweiFiguren ? (
              <AuswahlFeld
                control={control}
                name="zweiteFigurId"
                label="Zweite Figur"
                zahl
                optionen={figuren.map((f) => ({ value: String(f.id), label: f.name }))}
                description="Kommt mit einem zweiten Darsteller."
              />
            ) : null}
            {extras.length > 0 ? (
              <HakenFeld
                control={control}
                name="extraIds"
                label="Extras"
                optionen={extras.map((x) => ({
                  value: x.id,
                  label: `${x.name} · ${euro(x.preisCent)}`,
                }))}
              />
            ) : null}
            <div className="grid gap-6 sm:grid-cols-3">
              <AuswahlFeld
                control={control}
                name="stadtId"
                label="Ort"
                zahl
                optionen={staedte.map((s) => ({
                  value: String(s.id),
                  label: `${s.name} (Zone ${s.zone})`,
                }))}
              />
              <DatumFeld control={control} name="tag" label="Tag" />
              <UhrzeitFeld control={control} name="uhrzeit" label="Beginn der Feier" />
            </div>
            {alternativen ? (
              <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-3">
                <p className="text-sm">
                  {alternativen.length === 0
                    ? "In dieser Woche und der davor und danach ist für diese Figur niemand frei."
                    : "Belegt. Frei wäre:"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {alternativen.map((iso) => {
                    const d = new Date(iso);
                    return (
                      <Button
                        key={iso}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setValue("tag", berlinTag(d), { shouldDirty: true });
                          setValue("uhrzeit", berlinUhrzeit(d), { shouldDirty: true });
                          setAlternativen(null);
                        }}
                      >
                        {terminDe.format(d)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div className="grid gap-6 sm:grid-cols-3">
              <TextField
                control={control}
                name="kindName"
                label="Name des Kindes"
                maxLength={100}
              />
              <ZahlFeld control={control} name="kindAlter" label="Alter" einheit="Jahre" />
              <ZahlFeld control={control} name="kinderAnzahl" label="Kinder" />
            </div>
            <TextField
              control={control}
              name="notizKunde"
              label="Wünsche"
              multiline
              maxLength={5000}
            />
          </SectionCard>

          <SectionCard section={SECTIONS[1]!}>
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField control={control} name="kontaktName" label="Name" maxLength={200} />
              <AuswahlFeld
                control={control}
                name="quelle"
                label="Auftrag kam über"
                optionen={[
                  { value: "telefon", label: "Telefon" },
                  { value: "instagram", label: "Instagram" },
                  { value: "admin", label: "Anders" },
                ]}
              />
              <TextField control={control} name="kontaktEmail" label="E-Mail" maxLength={320} />
              <TextField control={control} name="kontaktTelefon" label="Telefon" maxLength={40} />
            </div>
            <div className="grid gap-6 sm:grid-cols-[1fr_8rem_1fr]">
              <TextField control={control} name="strasse" label="Straße und Nr." maxLength={300} />
              <TextField control={control} name="plz" label="PLZ" maxLength={10} />
              <TextField control={control} name="ort" label="Ort" maxLength={200} />
            </div>
          </SectionCard>

          <SectionCard section={SECTIONS[2]!}>
            {angebot ? (
              <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm">
                {angebot.positionen.map((p, i) => (
                  <div key={i} className="contents">
                    <dt>{p.bezeichnung}</dt>
                    <dd className="text-right tabular-nums">
                      {p.cent === 0 && p.art === "zone" ? "inklusive" : euro(p.cent)}
                    </dd>
                  </div>
                ))}
                <div className="contents font-medium">
                  <dt className="border-t pt-1.5">Summe</dt>
                  <dd className="border-t pt-1.5 text-right tabular-nums">
                    {euro(angebot.summeCent)}
                  </dd>
                </div>
                <dt className="text-muted-foreground">Anzahlung ({anzahlungProzent} %)</dt>
                <dd className="text-right text-muted-foreground tabular-nums">
                  {euro(angebot.anzahlungCent)}
                </dd>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Paket und Ort wählen.</p>
            )}
            <AuswahlFeld
              control={control}
              name="zahlungsart"
              label="Zahlung"
              optionen={[
                { value: "rechnung", label: "Rechnung / Überweisung" },
                { value: "mollie", label: "Online (Mollie)" },
              ]}
            />
          </SectionCard>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
