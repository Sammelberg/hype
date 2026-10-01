"use client";

import { BanknoteIcon, MailWarningIcon, PrinterIcon, Trash2Icon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { datumDe } from "@/buero/logik/ablauf";
import { type MahnungVorschlag, mahnTitel } from "@/buero/logik/forderung";
import { euro } from "@/buero/logik/geld";
import {
  entferneZahlungAction,
  erfasseZahlungAction,
  mahnungsvorschlagAction,
  schreibeMahnungAction,
} from "../../../_actions/forderungen";

type ZahlungZeile = { id: number; betrag: number; am: string; notiz: string | null };
type MahnungZeile = { id: number; stufe: number; am: string; frist: string; gesamt: number };

const zahlAusEingabe = (text: string) => Number(text.replace(/\./g, "").replace(",", "."));
const eingabeAusCent = (cent: number) => (cent / 100).toFixed(2).replace(".", ",");

// Beside an issued invoice: what came in against it and the reminders written for it.
export function Forderung({
  rechnungId,
  nummer,
  brutto,
  offen,
  zahlbar,
  mahnbar,
  zahlungen,
  mahnungen,
  heute,
  faelligAm,
}: {
  rechnungId: number;
  nummer: string;
  brutto: number;
  offen: number;
  /** Payments can be recorded (an issued invoice, not cancelled). */
  zahlbar: boolean;
  /** The next reminder can be written (open, past due, steps left). */
  mahnbar: boolean;
  zahlungen: ZahlungZeile[];
  mahnungen: MahnungZeile[];
  heute: string;
  faelligAm: string | null;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const anteil = brutto > 0 ? Math.min(1, Math.max(0, (brutto - offen) / brutto)) : 0;

  const entfernen = async (id: number) => {
    const result = await entferneZahlungAction({ id });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Zahlung entfernt.");
    router.refresh();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Zahlungen</CardTitle>
          <CardDescription>
            {offen <= 0
              ? "Vollständig bezahlt."
              : zahlungen.length === 0
                ? `Offen: ${euro(offen)}.`
                : `Bezahlt ${euro(brutto - offen)}, offen ${euro(offen)}.`}
          </CardDescription>
          {zahlbar && offen > 0 ? (
            <CardAction>
              <ZahlungDialog rechnungId={rechnungId} nummer={nummer} offen={offen} heute={heute} />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div
            role="meter"
            aria-label="Bezahlt"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(anteil * 100)}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <motion.div
              className="bg-success h-full origin-left rounded-full"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: anteil }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>
          {zahlungen.length > 0 ? (
            <ul role="list" className="flex flex-col divide-y text-sm">
              {zahlungen.map((z) => (
                <li key={z.id} className="flex items-center gap-3 py-2">
                  <span className="text-muted-foreground tabular-nums">{datumDe(z.am)}</span>
                  <span className="min-w-0 flex-1 truncate">{z.notiz}</span>
                  <span className="font-medium tabular-nums">{euro(z.betrag)}</span>
                  {zahlbar ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Zahlung vom ${datumDe(z.am)} entfernen`}
                        >
                          <Trash2Icon />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Zahlung entfernen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Nur für eine versehentlich erfasste Zahlung. Das Protokoll hält fest,
                            dass sie entfernt wurde; die Rechnung ist danach wieder offen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => void entfernen(z.id)}
                          >
                            Entfernen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      {zahlbar || mahnungen.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Mahnungen</CardTitle>
            <CardDescription>
              {mahnungen.length === 0
                ? faelligAm && faelligAm < heute
                  ? `Seit ${datumDe(faelligAm)} fällig und noch nicht erinnert.`
                  : faelligAm
                    ? `Fällig am ${datumDe(faelligAm)}; danach kann erinnert werden.`
                    : "Keine."
                : `${mahnungen.length} geschrieben.`}
            </CardDescription>
            {mahnbar ? (
              <CardAction>
                <MahnungDialog
                  rechnungId={rechnungId}
                  heute={heute}
                  titel={mahnTitel(
                    mahnungen.length ? Math.max(...mahnungen.map((m) => m.stufe)) + 1 : 0,
                  )}
                />
              </CardAction>
            ) : null}
          </CardHeader>
          {mahnungen.length > 0 ? (
            <CardContent>
              <ul role="list" className="flex flex-col divide-y text-sm">
                {mahnungen.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{mahnTitel(m.stufe)}</span>{" "}
                      <span className="text-muted-foreground">
                        vom {datumDe(m.am)}, Frist {datumDe(m.frist)}
                      </span>
                    </span>
                    <span className="tabular-nums">{euro(m.gesamt)}</span>
                    <Button asChild variant="ghost" size="icon-sm">
                      <a
                        href={`/admin/druck/mahnungen/${m.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${mahnTitel(m.stufe)} drucken`}
                      >
                        <PrinterIcon />
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}

function ZahlungDialog({
  rechnungId,
  nummer,
  offen,
  heute,
}: {
  rechnungId: number;
  nummer: string;
  offen: number;
  heute: string;
}) {
  const router = useRouter();
  const [auf, setAuf] = useState(false);
  const [betrag, setBetrag] = useState(eingabeAusCent(offen));
  const [am, setAm] = useState(heute);
  const [notiz, setNotiz] = useState("");
  const [busy, setBusy] = useState(false);

  const senden = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await erfasseZahlungAction({
      rechnungId,
      betrag: zahlAusEingabe(betrag),
      am,
      notiz: notiz || null,
    });
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie Betrag und Datum.");
    setAuf(false);
    toast.success(
      (result.data?.offen ?? 1) <= 0
        ? `Rechnung ${nummer} ist bezahlt.`
        : `Zahlung erfasst; offen sind noch ${euro(result.data!.offen)}.`,
    );
    router.refresh();
  };

  return (
    <Dialog
      open={auf}
      onOpenChange={(o) => {
        setAuf(o);
        if (o) setBetrag(eingabeAusCent(offen));
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <BanknoteIcon data-icon="inline-start" /> Zahlung erfassen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={senden} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Zahlung zu {nummer}</DialogTitle>
            <DialogDescription>
              Offen sind {euro(offen)}. Eine Teilzahlung lässt den Rest offen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="zahlung-betrag">Betrag</FieldLabel>
              <Input
                id="zahlung-betrag"
                inputMode="decimal"
                value={betrag}
                required
                onChange={(e) => setBetrag(e.target.value)}
                className="tabular-nums"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="zahlung-am">Eingang am</FieldLabel>
              <Input
                id="zahlung-am"
                type="date"
                value={am}
                max={heute}
                required
                onChange={(e) => setAm(e.target.value)}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="zahlung-notiz">Notiz</FieldLabel>
            <Input
              id="zahlung-notiz"
              value={notiz}
              maxLength={300}
              placeholder="Überweisung, Verwendungszweck …"
              onChange={(e) => setNotiz(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Zahlung erfassen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type Vorschlag = {
  vorschlag: MahnungVorschlag | null;
  letzteStufe: boolean;
  basiszinsFehlt: boolean;
} | null;

function MahnungDialog({
  rechnungId,
  heute,
  titel,
}: {
  rechnungId: number;
  heute: string;
  titel: string;
}) {
  const router = useRouter();
  const [auf, setAuf] = useState(false);
  const [am, setAm] = useState(heute);
  const [vorschlag, setVorschlag] = useState<Vorschlag>(null);
  const [werte, setWerte] = useState({
    frist: "",
    zinssatz: "0",
    zinsen: "0,00",
    pauschale: "0,00",
    gebuehr: "0,00",
    text: "",
  });
  const [busy, setBusy] = useState(false);

  // The proposal follows the day of the letter: interest runs to it.
  useEffect(() => {
    if (!auf) return;
    let aktuell = true;
    void mahnungsvorschlagAction({ rechnungId, am }).then((result) => {
      if (!aktuell) return;
      const v = result.data ?? null;
      setVorschlag(v);
      if (v?.vorschlag)
        setWerte((w) => ({
          ...w,
          frist: v.vorschlag!.neueFrist,
          zinssatz: String(v.vorschlag!.zinssatz),
          zinsen: eingabeAusCent(v.vorschlag!.zinsen),
          pauschale: eingabeAusCent(v.vorschlag!.pauschale),
          gebuehr: eingabeAusCent(v.vorschlag!.gebuehr),
        }));
    });
    return () => {
      aktuell = false;
    };
  }, [auf, am, rechnungId]);

  const v = vorschlag?.vorschlag ?? null;
  const gesamt =
    (v?.offen ?? 0) +
    Math.round(
      (zahlAusEingabe(werte.zinsen) +
        zahlAusEingabe(werte.pauschale) +
        zahlAusEingabe(werte.gebuehr)) *
        100,
    );

  const senden = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await schreibeMahnungAction({
      rechnungId,
      am,
      frist: werte.frist,
      zinssatz: Number(werte.zinssatz.replace(",", ".")),
      zinsen: zahlAusEingabe(werte.zinsen),
      pauschale: zahlAusEingabe(werte.pauschale),
      gebuehr: zahlAusEingabe(werte.gebuehr),
      text: werte.text || null,
    });
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die Beträge.");
    setAuf(false);
    toast.success(`${mahnTitel(result.data!.stufe)} geschrieben.`, {
      action: {
        label: "Drucken",
        onClick: () => window.open(`/admin/druck/mahnungen/${result.data!.id}`, "_blank"),
      },
    });
    router.refresh();
  };

  const feld = (name: keyof typeof werte, label: string, beschreibung?: string) => (
    <Field>
      <FieldLabel htmlFor={`mahnung-${name}`}>{label}</FieldLabel>
      <Input
        id={`mahnung-${name}`}
        inputMode="decimal"
        value={werte[name]}
        onChange={(e) => setWerte((w) => ({ ...w, [name]: e.target.value }))}
        className="tabular-nums"
      />
      {beschreibung ? <FieldDescription>{beschreibung}</FieldDescription> : null}
    </Field>
  );

  return (
    <Dialog open={auf} onOpenChange={setAuf}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <MailWarningIcon data-icon="inline-start" /> {titel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={senden} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{titel} schreiben</DialogTitle>
            <DialogDescription>
              Vorgeschlagen nach §§ 286, 288 BGB; jeder Betrag lässt sich ändern. Geschrieben bleibt
              die Mahnung, wie sie ist.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="mahnung-am">Datum</FieldLabel>
              <Input
                id="mahnung-am"
                type="date"
                value={am}
                required
                onChange={(e) => setAm(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="mahnung-frist">Neue Frist</FieldLabel>
              <Input
                id="mahnung-frist"
                type="date"
                value={werte.frist}
                min={am}
                required
                onChange={(e) => setWerte((w) => ({ ...w, frist: e.target.value }))}
              />
            </Field>
          </div>
          {v ? (
            <>
              <p className="text-sm text-muted-foreground">
                Offen {euro(v.offen)}.{" "}
                {v.verzugSeit
                  ? `In Verzug seit ${datumDe(v.verzugSeit)} (${v.tage} Tage).`
                  : "Noch nicht in Verzug: ohne Zinsen und Pauschale."}
              </p>
              {vorschlag?.basiszinsFehlt ? (
                <p className="text-warning text-sm">
                  Den Basiszinssatz tragen Sie unter Firmendaten ein; bis dahin sind die Zinsen ohne
                  ihn berechnet.
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                {feld("zinssatz", "Zinssatz in %", "Basiszins + 9 (Firmen) oder + 5 Punkte.")}
                {feld("zinsen", "Verzugszinsen €")}
                {feld(
                  "pauschale",
                  "Verzugspauschale €",
                  "§288 Abs. 5 BGB: 40 € einmal, nur Firmen.",
                )}
                {feld("gebuehr", "Mahngebühr €", "Nur tatsächliche Kosten.")}
              </div>
              <Field>
                <FieldLabel htmlFor="mahnung-text">Eigener Text</FieldLabel>
                <Textarea
                  id="mahnung-text"
                  rows={2}
                  maxLength={3000}
                  value={werte.text}
                  placeholder="Leer: der übliche Text dieser Stufe."
                  onChange={(e) => setWerte((w) => ({ ...w, text: e.target.value }))}
                />
              </Field>
              <p className="flex items-baseline justify-between border-t pt-3 font-medium">
                Zu zahlen <span className="tabular-nums">{euro(gesamt)}</span>
              </p>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Vorschlag wird berechnet …
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={busy || !v}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              {titel} schreiben
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
