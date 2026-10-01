"use client";

import { AlarmClockIcon, CheckIcon, PlusIcon, Undo2Icon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { datumDe, tagePlus } from "@/buero/logik/ablauf";
import { cn } from "@/lib/utils";
import {
  createWiedervorlageAction,
  erledigeWiedervorlageAction,
  verschiebeWiedervorlageAction,
} from "../../_actions/historie";

export type WiedervorlagePunkt = {
  id: number;
  titel: string;
  notiz: string | null;
  faelligAm: string;
  erledigt: boolean;
  kundeId: number | null;
  kundeName: string | null;
};

// A new Wiedervorlage: what, when, optionally for a customer. Its own form in a dialog — the
// dialog is portalled out of any surrounding form, and the submit stops here.
export function NeueWiedervorlage({
  heute,
  kundeId = null,
  label = "Wiedervorlage",
  variant = "outline",
}: {
  heute: string;
  kundeId?: number | null;
  label?: string;
  variant?: "outline" | "default" | "ghost";
}) {
  const router = useRouter();
  const [auf, setAuf] = useState(false);
  const [titel, setTitel] = useState("");
  const [notiz, setNotiz] = useState("");
  const [faelligAm, setFaelligAm] = useState(tagePlus(heute, 7));
  const [busy, setBusy] = useState(false);

  const senden = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    const result = await createWiedervorlageAction({
      kundeId,
      titel,
      notiz: notiz || null,
      faelligAm,
    });
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte sagen Sie, worum es geht.");
    setAuf(false);
    setTitel("");
    setNotiz("");
    toast.success(`Wiedervorlage am ${datumDe(faelligAm)}.`);
    router.refresh();
  };

  const schnell = [
    { label: "Morgen", tage: 1 },
    { label: "In einer Woche", tage: 7 },
    { label: "In einem Monat", tage: 30 },
  ];

  return (
    <Dialog open={auf} onOpenChange={setAuf}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant={variant}>
          <PlusIcon data-icon="inline-start" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={senden} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Wiedervorlage</DialogTitle>
            <DialogDescription>
              Am gewählten Tag steht sie auf der Übersicht ganz oben.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="wv-titel">Worum es geht</FieldLabel>
            <Input
              id="wv-titel"
              value={titel}
              required
              maxLength={300}
              placeholder="Nachfassen: Angebot Kundenportal"
              onChange={(e) => setTitel(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="wv-am">Am</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="wv-am"
                type="date"
                value={faelligAm}
                min={heute}
                required
                className="w-auto"
                onChange={(e) => setFaelligAm(e.target.value)}
              />
              {schnell.map((s) => (
                <Button
                  key={s.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={faelligAm === tagePlus(heute, s.tage)}
                  onClick={() => setFaelligAm(tagePlus(heute, s.tage))}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="wv-notiz">Notiz</FieldLabel>
            <Textarea
              id="wv-notiz"
              rows={2}
              maxLength={2000}
              value={notiz}
              onChange={(e) => setNotiz(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Vormerken
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// The list: due ones marked, done with one click (and back), pushed on by a week. Done items
// fold away with a short slide.
export function WiedervorlagenListe({
  punkte,
  heute,
  mitKunde = true,
  leer = "Nichts vorgemerkt.",
}: {
  punkte: WiedervorlagePunkt[];
  heute: string;
  mitKunde?: boolean;
  leer?: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [weg, setWeg] = useState<number[]>([]);

  const erledigen = async (p: WiedervorlagePunkt) => {
    setWeg((w) => [...w, p.id]);
    const result = await erledigeWiedervorlageAction({ id: p.id, erledigt: !p.erledigt });
    if (result.serverError) {
      setWeg((w) => w.filter((x) => x !== p.id));
      return void toast.error(result.serverError.message);
    }
    toast.success(p.erledigt ? "Wieder offen." : "Erledigt.", {
      action: p.erledigt
        ? undefined
        : {
            label: "Rückgängig",
            onClick: () =>
              void erledigeWiedervorlageAction({ id: p.id, erledigt: false }).then(() => {
                setWeg((w) => w.filter((x) => x !== p.id));
                router.refresh();
              }),
          },
    });
    router.refresh();
  };

  const verschieben = async (p: WiedervorlagePunkt) => {
    const neu = tagePlus(p.faelligAm < heute ? heute : p.faelligAm, 7);
    const result = await verschiebeWiedervorlageAction({ id: p.id, faelligAm: neu });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success(`Verschoben auf ${datumDe(neu)}.`);
    router.refresh();
  };

  const sichtbar = punkte.filter((p) => !weg.includes(p.id));
  if (sichtbar.length === 0) return <p className="text-sm text-muted-foreground">{leer}</p>;
  return (
    <ul role="list" className="flex flex-col">
      <AnimatePresence initial={false}>
        {sichtbar.map((p) => {
          const faellig = !p.erledigt && p.faelligAm <= heute;
          return (
            <motion.li
              key={p.id}
              layout={!reduce}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, height: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-start gap-3 border-b py-2.5 last:border-b-0"
            >
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="mt-0.5 shrink-0 rounded-full"
                aria-label={p.erledigt ? `„${p.titel}“ wieder öffnen` : `„${p.titel}“ erledigt`}
                onClick={() => void erledigen(p)}
              >
                {p.erledigt ? <Undo2Icon /> : <CheckIcon />}
              </Button>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={cn("text-sm font-medium", p.erledigt && "line-through")}>
                  {p.titel}
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className={cn(faellig && "text-warning font-medium")}>
                    {p.faelligAm < heute && !p.erledigt
                      ? `Seit ${datumDe(p.faelligAm)}`
                      : p.faelligAm === heute
                        ? "Heute"
                        : datumDe(p.faelligAm)}
                  </span>
                  {mitKunde && p.kundeName && p.kundeId ? (
                    <>
                      {" · "}
                      <Link
                        href={`/admin/kunden/${p.kundeId}` as never}
                        className="underline underline-offset-2"
                      >
                        {p.kundeName}
                      </Link>
                    </>
                  ) : null}
                </span>
                {p.notiz ? (
                  <span className="text-xs whitespace-pre-line text-muted-foreground">
                    {p.notiz}
                  </span>
                ) : null}
              </div>
              {p.erledigt ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`„${p.titel}“ eine Woche später`}
                  title="Eine Woche später"
                  onClick={() => void verschieben(p)}
                >
                  <AlarmClockIcon />
                </Button>
              )}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
