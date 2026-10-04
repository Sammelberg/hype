"use client";

import { CheckIcon, FlagIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { euro } from "@/buero/logik/geld";
import { kannWechseln } from "@/buchung/logik/status";
import { stornoGebuehr } from "@/buchung/logik/storno";
import type { BuchungStatus } from "@/buchung/logik/typen";
import { setzeStatusAction } from "../../../../_actions/buchung";

// The steps a booking can take from here: deposit received, cancelled by the grid, done, declined.
// Cancelling shows what the grid keeps before anything happens.
export function StatusAktionen({
  id,
  status,
  beginn,
  summeCent,
  anzahlungCent,
}: {
  id: number;
  status: BuchungStatus;
  beginn: string;
  summeCent: number;
  anzahlungCent: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [storno, setStorno] = useState<{ offen: boolean; jetzt: number }>({
    offen: false,
    jetzt: 0,
  });
  const [durch, setDurch] = useState<"kunde" | "agentur">("kunde");
  const [grund, setGrund] = useState("");

  const schritt = async (
    aenderung: Parameters<typeof setzeStatusAction>[0]["aenderung"],
    meldung: string,
  ) => {
    setBusy(true);
    const result = await setzeStatusAction({ id, aenderung });
    setBusy(false);
    if (result?.serverError) return void toast.error(result.serverError.message);
    toast.success(meldung);
    setStorno((s) => ({ ...s, offen: false }));
    router.refresh();
  };

  const vorschau = storno.offen
    ? stornoGebuehr({
        beginn: new Date(beginn),
        jetzt: new Date(storno.jetzt),
        summeCent,
        bezahltCent: status === "bestaetigt" ? anzahlungCent : 0,
        durch,
      })
    : null;

  return (
    <div className="flex flex-wrap gap-2">
      {kannWechseln(status, "bestaetigt") && status === "reserviert" ? (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => schritt({ nach: "bestaetigt" }, "Bestätigt.")}
        >
          <CheckIcon data-icon="inline-start" /> Anzahlung erhalten
        </Button>
      ) : null}
      {kannWechseln(status, "abgeschlossen") ? (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => schritt({ nach: "abgeschlossen" }, "Abgeschlossen.")}
        >
          <FlagIcon data-icon="inline-start" /> Feier war — abschließen
        </Button>
      ) : null}
      {kannWechseln(status, "abgelehnt") ? (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => schritt({ nach: "abgelehnt" }, "Anfrage abgelehnt.")}
        >
          <XIcon data-icon="inline-start" /> Anfrage ablehnen
        </Button>
      ) : null}
      <Dialog open={storno.offen} onOpenChange={(offen) => setStorno({ offen, jetzt: Date.now() })}>
        {kannWechseln(status, "storniert") ? (
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={busy}>
              <XIcon data-icon="inline-start" /> Stornieren
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buchung stornieren</DialogTitle>
            <DialogDescription>
              Nach der Stornotabelle der AGB. Der Darsteller wird frei.
            </DialogDescription>
          </DialogHeader>
          <FieldSet>
            <FieldLegend variant="label">Wer storniert?</FieldLegend>
            <RadioGroup value={durch} onValueChange={(v) => setDurch(v as "kunde" | "agentur")}>
              <Field orientation="horizontal">
                <RadioGroupItem value="kunde" id="durch-kunde" />
                <FieldLabel htmlFor="durch-kunde" className="font-normal">
                  Die Kundin
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="agentur" id="durch-agentur" />
                <FieldLabel htmlFor="durch-agentur" className="font-normal">
                  Hype Agency (volle Erstattung, Ersatz anbieten)
                </FieldLabel>
              </Field>
            </RadioGroup>
          </FieldSet>
          <Field>
            <FieldLabel htmlFor="storno-grund">Grund (intern)</FieldLabel>
            <Textarea
              id="storno-grund"
              value={grund}
              maxLength={300}
              onChange={(e) => setGrund(e.target.value)}
            />
          </Field>
          {vorschau ? (
            <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 rounded-lg bg-muted p-3 text-sm">
              <dt>Stornogebühr</dt>
              <dd className="text-right tabular-nums">{euro(vorschau.gebuehrCent)}</dd>
              <dt>Zurück an die Kundin</dt>
              <dd className="text-right tabular-nums">{euro(vorschau.erstattungCent)}</dd>
              {vorschau.nachforderungCent > 0 ? (
                <>
                  <dt>Noch offen</dt>
                  <dd className="text-right tabular-nums">{euro(vorschau.nachforderungCent)}</dd>
                </>
              ) : null}
            </dl>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStorno((s) => ({ ...s, offen: false }))}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() =>
                schritt({ nach: "storniert", durch, grund: grund || null }, "Storniert.")
              }
            >
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Stornieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
