"use client";

import {
  AlarmClockIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileSignatureIcon,
  FileUserIcon,
  GlobeIcon,
  MailWarningIcon,
  PlusIcon,
  ReceiptIcon,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  jeTag,
  KALENDER_ARTEN,
  type KalenderArt,
  type KalenderEreignis,
} from "@/buero/logik/kalender";
import type { TerminInput } from "@/buero/logik/typen";
import { cn } from "@/lib/utils";
import {
  type KundeKurz,
  neuerTermin,
  TerminDialog,
} from "../../../_components/buero/termin-dialog";

export type Ansicht = "monat" | "woche" | "liste";

// Each kind of event: an icon (so colour is never the only cue) and its accent.
const ART: Record<KalenderArt, { Icon: LucideIcon; klasse: string }> = {
  termin: { Icon: CalendarIcon, klasse: "border-l-primary-soft bg-primary/15 text-foreground" },
  wiedervorlage: { Icon: AlarmClockIcon, klasse: "border-l-warning bg-warning/10" },
  faellig: { Icon: ReceiptIcon, klasse: "border-l-chart-3 bg-muted" },
  mahnfrist: { Icon: MailWarningIcon, klasse: "border-l-destructive bg-destructive/10" },
  angebot: { Icon: FileUserIcon, klasse: "border-l-primary-soft bg-muted" },
  kuendigung: { Icon: FileSignatureIcon, klasse: "border-l-warning bg-muted" },
  vertragsende: { Icon: FileSignatureIcon, klasse: "border-l-muted-foreground bg-muted" },
  veroeffentlichung: { Icon: GlobeIcon, klasse: "border-l-success bg-success/10" },
};

const utc = (iso: string) => new Date(`${iso}T12:00:00Z`);
const fmt = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("de-DE", { ...o, timeZone: "UTC" });
const langerTag = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const kurzerWochentag = fmt({ weekday: "short" });
const tagMonat = fmt({ day: "numeric", month: "numeric" });
const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const zeitText = (e: KalenderEreignis) =>
  e.uhrzeit ? `${e.uhrzeit}${e.bisUhrzeit ? `–${e.bisUhrzeit}` : ""}` : null;

// One event: the owner's Termin opens for editing, everything else leads to its document.
function Eintrag({
  e,
  tag,
  ausfuehrlich = false,
  onTermin,
}: {
  e: KalenderEreignis;
  tag: string;
  ausfuehrlich?: boolean;
  onTermin: (e: KalenderEreignis) => void;
}) {
  const { Icon, klasse } = ART[e.art];
  // On a later day of a Termin over several days, its start time says nothing.
  const zeit = e.von === tag ? zeitText(e) : null;
  const inhalt = (
    <>
      <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 opacity-80" />
      <span className="min-w-0 flex-1">
        <span className={cn("block", ausfuehrlich ? "" : "truncate")}>
          {zeit ? <span className="mr-1 tabular-nums opacity-80">{zeit}</span> : null}
          {e.titel}
        </span>
        {ausfuehrlich && (e.ort || e.kundeName) ? (
          <span className="block text-xs text-muted-foreground">
            {[e.ort, e.kundeName].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </span>
      <span className="sr-only">({KALENDER_ARTEN[e.art]})</span>
    </>
  );
  const klassen = cn(
    "flex w-full items-start gap-1.5 rounded-md border-l-2 px-1.5 py-1 text-left text-xs leading-snug transition-colors hover:brightness-125 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    ausfuehrlich && "text-sm",
    klasse,
  );
  if (e.terminId)
    return (
      <button type="button" className={klassen} onClick={() => onTermin(e)}>
        {inhalt}
      </button>
    );
  return (
    <Link href={(e.href ?? "/admin/kalender") as never} className={klassen}>
      {inhalt}
    </Link>
  );
}

export function Kalender({
  ansicht,
  heute,
  titel,
  tage,
  wochen,
  monat,
  ereignisse,
  kunden,
  termine,
  links,
}: {
  ansicht: Ansicht;
  heute: string;
  titel: string;
  /** The days shown, in order. */
  tage: string[];
  /** The month view's weeks. */
  wochen: string[][];
  /** „2026-10“ in the month view: days of other months are dimmed. */
  monat: string | null;
  ereignisse: KalenderEreignis[];
  kunden: KundeKurz[];
  /** The Termine as the form edits them, by id. */
  termine: Record<number, TerminInput>;
  links: { zurueck: string; vor: string; heute: string; ansichten: Record<Ansicht, string> };
}) {
  const reduce = useReducedMotion();
  const [aus, setAus] = useState<KalenderArt[]>([]);
  const [dialog, setDialog] = useState<{ id: number | null; werte: TerminInput } | null>(null);
  const [tagOffen, setTagOffen] = useState<string | null>(null);
  const sichtbar = ereignisse.filter((e) => !aus.includes(e.art));
  const proTag = useMemo(() => jeTag(sichtbar, tage), [sichtbar, tage]);
  const vorhanden = (Object.keys(KALENDER_ARTEN) as KalenderArt[]).filter((a) =>
    ereignisse.some((e) => e.art === a),
  );

  const neu = (tag: string) => setDialog({ id: null, werte: neuerTermin(tag) });
  const oeffne = (e: KalenderEreignis) =>
    e.terminId && termine[e.terminId] && setDialog({ id: e.terminId, werte: termine[e.terminId]! });

  const NeuKnopf = ({ tag, sichtbarImmer = false }: { tag: string; sichtbarImmer?: boolean }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Termin am ${langerTag.format(utc(tag))} eintragen`}
      className={cn(
        !sichtbarImmer &&
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
      )}
      onClick={() => neu(tag)}
    >
      <PlusIcon />
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon-sm">
            <Link href={links.zurueck as never} aria-label="Zurück">
              <ChevronLeftIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={links.heute as never}>Heute</Link>
          </Button>
          <Button asChild variant="outline" size="icon-sm">
            <Link href={links.vor as never} aria-label="Weiter">
              <ChevronRightIcon />
            </Link>
          </Button>
          <h2 className="ml-2 text-lg font-semibold tracking-tight" aria-live="polite">
            {titel}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Ansicht" className="flex rounded-lg border p-0.5">
            {(["monat", "woche", "liste"] as const).map((a) => (
              <Button
                key={a}
                asChild
                size="sm"
                variant={ansicht === a ? "secondary" : "ghost"}
                className="h-7"
              >
                <Link
                  href={links.ansichten[a] as never}
                  aria-current={ansicht === a ? "page" : undefined}
                >
                  {{ monat: "Monat", woche: "Woche", liste: "Liste" }[a]}
                </Link>
              </Button>
            ))}
          </nav>
          <Button type="button" size="sm" onClick={() => neu(heute)}>
            <PlusIcon data-icon="inline-start" /> Termin
          </Button>
        </div>
      </div>

      {vorhanden.length > 1 ? (
        <div role="group" aria-label="Was der Kalender zeigt" className="flex flex-wrap gap-1.5">
          {vorhanden.map((a) => {
            const { Icon } = ART[a];
            const an = !aus.includes(a);
            return (
              <Button
                key={a}
                type="button"
                size="sm"
                variant={an ? "secondary" : "ghost"}
                aria-pressed={an}
                className={cn("h-7", !an && "text-muted-foreground line-through")}
                onClick={() => setAus((x) => (an ? [...x, a] : x.filter((y) => y !== a)))}
              >
                <Icon data-icon="inline-start" /> {KALENDER_ARTEN[a]}
              </Button>
            );
          })}
        </div>
      ) : null}

      <motion.div
        key={`${ansicht}-${tage[0]}`}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      >
        {ansicht === "monat" ? (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div aria-hidden="true" className="grid grid-cols-7 border-b bg-muted/40">
              {WOCHENTAGE.map((w) => (
                <div key={w} className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {w}
                </div>
              ))}
            </div>
            <ol className="grid grid-cols-7">
              {wochen.flat().map((tag) => {
                const liste = proTag.get(tag) ?? [];
                const anders = monat !== null && !tag.startsWith(monat);
                const istHeute = tag === heute;
                const mehr = liste.length - 3;
                return (
                  <li
                    key={tag}
                    aria-label={`${langerTag.format(utc(tag))}${istHeute ? ", heute" : ""}, ${liste.length === 0 ? "nichts" : `${liste.length} ${liste.length === 1 ? "Eintrag" : "Einträge"}`}`}
                    className={cn(
                      "group flex min-h-24 flex-col gap-1 border-r border-b p-1 sm:min-h-28 [&:nth-child(7n)]:border-r-0",
                      anders && "bg-muted/30",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-xs tabular-nums",
                          istHeute && "bg-primary font-semibold text-primary-foreground",
                          anders && !istHeute && "text-muted-foreground",
                        )}
                      >
                        {Number(tag.slice(8))}
                      </span>
                      <NeuKnopf tag={tag} />
                    </div>
                    <ul className="hidden flex-col gap-0.5 sm:flex">
                      {liste.slice(0, 3).map((e) => (
                        <li key={e.key}>
                          <Eintrag e={e} tag={tag} onTermin={oeffne} />
                        </li>
                      ))}
                    </ul>
                    {liste.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setTagOffen(tag)}
                        className={cn(
                          "rounded-sm px-1 text-left text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          mehr > 0 ? "" : "sm:hidden",
                        )}
                      >
                        <span className="sm:hidden" aria-hidden="true">
                          {liste.map((e) => (
                            <span
                              key={e.key}
                              className={cn(
                                "mr-0.5 inline-block size-1.5 rounded-full",
                                e.art === "termin" ? "bg-primary-soft" : "bg-muted-foreground",
                              )}
                            />
                          ))}
                        </span>
                        <span className="sr-only sm:not-sr-only">
                          {mehr > 0 ? `+${mehr} weitere` : `${liste.length} anzeigen`}
                        </span>
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}

        {ansicht === "woche" ? (
          <ol className="grid gap-3 md:grid-cols-7">
            {tage.map((tag) => {
              const liste = proTag.get(tag) ?? [];
              const istHeute = tag === heute;
              return (
                <li
                  key={tag}
                  className={cn(
                    "group flex min-h-40 flex-col gap-2 rounded-xl border bg-card p-2",
                    istHeute && "ring-2 ring-primary/60",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm">
                      <span className="text-muted-foreground">
                        {kurzerWochentag.format(utc(tag))}
                      </span>{" "}
                      <span className="font-semibold tabular-nums">
                        {tagMonat.format(utc(tag))}
                      </span>
                      {istHeute ? <span className="sr-only"> (heute)</span> : null}
                    </h3>
                    <NeuKnopf tag={tag} />
                  </div>
                  <ul className="flex flex-col gap-1">
                    {liste.map((e) => (
                      <li key={e.key}>
                        <Eintrag e={e} tag={tag} ausfuehrlich onTermin={oeffne} />
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        ) : null}

        {ansicht === "liste" ? (
          tage.some((t) => (proTag.get(t) ?? []).length > 0) ? (
            <ol className="flex flex-col gap-4">
              {tage
                .filter((t) => (proTag.get(t) ?? []).length > 0)
                .map((tag) => (
                  <li key={tag} className="grid gap-2 sm:grid-cols-[12rem_minmax(0,1fr)]">
                    <h3
                      className={cn(
                        "text-sm font-medium sm:pt-1.5",
                        tag === heute && "text-primary-soft",
                      )}
                    >
                      {tag === heute ? "Heute, " : ""}
                      {langerTag.format(utc(tag))}
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {(proTag.get(tag) ?? []).map((e) => (
                        <li key={e.key}>
                          <Eintrag e={e} tag={tag} ausfuehrlich onTermin={oeffne} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ol>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nichts in diesem Zeitraum</EmptyTitle>
                <EmptyDescription>
                  Tragen Sie einen Termin ein; Fälligkeiten und Fristen erscheinen von selbst.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        ) : null}
      </motion.div>

      <Dialog open={tagOffen !== null} onOpenChange={(o) => !o && setTagOffen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tagOffen ? langerTag.format(utc(tagOffen)) : ""}</DialogTitle>
            <DialogDescription>Alles an diesem Tag.</DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-1">
            {(tagOffen ? (proTag.get(tagOffen) ?? []) : []).map((e) => (
              <li key={e.key}>
                <Eintrag
                  e={e}
                  tag={tagOffen!}
                  ausfuehrlich
                  onTermin={(x) => {
                    setTagOffen(null);
                    oeffne(x);
                  }}
                />
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => {
              const t = tagOffen!;
              setTagOffen(null);
              neu(t);
            }}
          >
            <PlusIcon data-icon="inline-start" /> Termin an diesem Tag
          </Button>
        </DialogContent>
      </Dialog>

      {dialog ? (
        <TerminDialog
          key={`${dialog.id ?? "neu"}-${dialog.werte.datum}`}
          offen
          onOffen={(o) => !o && setDialog(null)}
          terminId={dialog.id}
          werte={dialog.werte}
          kunden={kunden}
        />
      ) : null}
    </div>
  );
}
