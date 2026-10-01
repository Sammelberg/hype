"use client";

import {
  BanknoteIcon,
  CalendarIcon,
  FileTextIcon,
  MailIcon,
  MailWarningIcon,
  MessageSquareTextIcon,
  PhoneIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Ereignis } from "@/buero/daten/historie";
import { datumDe } from "@/buero/logik/ablauf";
import type { KalenderEreignis } from "@/buero/logik/kalender";
import { HISTORIE_ARTEN, type TerminInput } from "@/buero/logik/typen";
import { cn } from "@/lib/utils";
import { addHistorieAction, deleteHistorieAction } from "../../../_actions/historie";
import { neuerTermin, TerminDialog } from "../../../_components/buero/termin-dialog";
import {
  NeueWiedervorlage,
  WiedervorlagenListe,
  type WiedervorlagePunkt,
} from "../../../_components/buero/wiedervorlage";

const ICON: Record<Ereignis["art"], typeof PhoneIcon> = {
  notiz: MessageSquareTextIcon,
  anruf: PhoneIcon,
  email: MailIcon,
  termin: CalendarIcon,
  dokument: FileTextIcon,
  geld: BanknoteIcon,
  mahnung: MailWarningIcon,
};

const zeit = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});
const wann = (am: string) => (am.length === 10 ? datumDe(am) : zeit.format(new Date(am)));

const ERSTE = 8;

// Beside the customer card: what is to be picked up again, and everything that happened —
// hand-written notes of calls, mails and meetings between the documents' own events.
export function KundenVerlauf({
  kundeId,
  heute,
  ereignisse,
  wiedervorlagen,
  termine,
  kundeName,
}: {
  kundeId: number;
  heute: string;
  ereignisse: Ereignis[];
  wiedervorlagen: WiedervorlagePunkt[];
  termine: { ereignis: KalenderEreignis; eingabe: TerminInput }[];
  kundeName: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [alle, setAlle] = useState(false);
  const [termin, setTermin] = useState<{ id: number | null; werte: TerminInput } | null>(null);
  const sichtbar = alle ? ereignisse : ereignisse.slice(0, ERSTE);

  const loeschen = async (id: number) => {
    const result = await deleteHistorieAction({ id });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Eintrag gelöscht.");
    router.refresh();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Termine</CardTitle>
          <CardDescription>
            {termine.length === 0 ? "Keiner geplant." : `${termine.length} anstehend.`}
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setTermin({ id: null, werte: neuerTermin(heute, kundeId) })}
            >
              <PlusIcon data-icon="inline-start" /> Termin
            </Button>
          </CardAction>
        </CardHeader>
        {termine.length > 0 ? (
          <CardContent>
            <ul role="list" className="flex flex-col gap-1.5">
              {termine.map(({ ereignis: t, eingabe }) => (
                <li key={t.key}>
                  <button
                    type="button"
                    onClick={() => setTermin({ id: t.terminId!, werte: eingabe })}
                    className="flex w-full items-baseline gap-3 rounded-lg border-l-2 border-l-primary-soft bg-primary/10 px-3 py-2 text-left text-sm hover:brightness-125 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {t.von.split("-").reverse().join(".")}
                      {t.uhrzeit ? `, ${t.uhrzeit}` : ""}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{t.titel}</span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        ) : null}
      </Card>
      {termin ? (
        <TerminDialog
          key={termin.id ?? "neu"}
          offen
          onOffen={(o) => !o && setTermin(null)}
          terminId={termin.id}
          werte={termin.werte}
          kunden={[{ id: kundeId, name: kundeName }]}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Wiedervorlagen</CardTitle>
          <CardDescription>
            {wiedervorlagen.length === 0 ? "Nichts vorgemerkt." : `${wiedervorlagen.length} offen.`}
          </CardDescription>
          <CardAction>
            <NeueWiedervorlage heute={heute} kundeId={kundeId} label="Vormerken" />
          </CardAction>
        </CardHeader>
        {wiedervorlagen.length > 0 ? (
          <CardContent>
            <WiedervorlagenListe punkte={wiedervorlagen} heute={heute} mitKunde={false} />
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verlauf</CardTitle>
          <CardDescription>
            Gespräche, Mails und Termine, dazu alles, was mit den Dokumenten geschah.
          </CardDescription>
          <CardAction>
            <NeuerEintrag kundeId={kundeId} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {ereignisse.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch nichts.</p>
          ) : (
            <ol className="relative flex flex-col gap-4 before:absolute before:inset-y-1 before:left-[13px] before:w-px before:bg-border">
              {sichtbar.map((e, index) => {
                const Icon = ICON[e.art];
                const handschrift = e.notizId !== undefined;
                return (
                  <motion.li
                    key={e.key}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: reduce ? 0 : Math.min(index, 8) * 0.03,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    className="relative flex gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card",
                        handschrift ? "text-primary-soft" : "text-muted-foreground",
                        e.art === "mahnung" && "text-warning",
                        e.art === "geld" && "text-success",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
                      <p className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-medium">
                          {e.href ? (
                            <Link href={e.href as never} className="hover:underline">
                              {e.titel}
                            </Link>
                          ) : (
                            e.titel
                          )}
                        </span>
                        <time
                          dateTime={e.am}
                          className="shrink-0 text-xs text-muted-foreground tabular-nums"
                        >
                          {wann(e.am)}
                        </time>
                      </p>
                      {e.text ? (
                        <p className="text-sm whitespace-pre-line text-muted-foreground">
                          {e.text}
                        </p>
                      ) : null}
                      {handschrift ? (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          {e.autor ? <span>{e.autor}</span> : null}
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-sm hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            onClick={() => void loeschen(e.notizId!)}
                          >
                            <Trash2Icon aria-hidden="true" className="size-3" /> Löschen
                          </button>
                        </p>
                      ) : null}
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          )}
          {ereignisse.length > ERSTE ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setAlle((a) => !a)}
            >
              {alle ? "Weniger zeigen" : `Alle ${ereignisse.length} zeigen`}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

function NeuerEintrag({ kundeId }: { kundeId: number }) {
  const router = useRouter();
  const [auf, setAuf] = useState(false);
  const [art, setArt] = useState<keyof typeof HISTORIE_ARTEN>("anruf");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const senden = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    const result = await addHistorieAction({ kundeId, art, text });
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte schreiben Sie etwas dazu.");
    setAuf(false);
    setText("");
    toast.success(`${HISTORIE_ARTEN[art]} festgehalten.`);
    router.refresh();
  };

  return (
    <Dialog open={auf} onOpenChange={setAuf}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <PlusIcon data-icon="inline-start" /> Eintrag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={senden} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>In den Verlauf</DialogTitle>
            <DialogDescription>Was besprochen oder vereinbart wurde.</DialogDescription>
          </DialogHeader>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={art}
            onValueChange={(v) => v && setArt(v as keyof typeof HISTORIE_ARTEN)}
            aria-label="Art des Eintrags"
            className="self-start"
          >
            {Object.entries(HISTORIE_ARTEN).map(([wert, label]) => (
              <ToggleGroupItem key={wert} value={wert}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Field>
            <FieldLabel htmlFor="verlauf-text">Text</FieldLabel>
            <Textarea
              id="verlauf-text"
              rows={4}
              maxLength={5000}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Festhalten
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
