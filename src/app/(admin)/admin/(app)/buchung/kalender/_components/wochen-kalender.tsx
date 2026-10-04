"use client";

import { BanIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Block } from "@/buchung/logik/woche";
import { SperreDialog, type SperreVorschlag } from "./sperre-dialog";

export type BlockInfo = {
  art: "einsatz" | "sperre";
  href: string | null;
  titel: string;
  zeile: string;
  /** For screen readers: the whole block in one sentence. */
  beschreibung: string;
  reserviert: boolean;
  darstellerId: number;
};

const ZEIT = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const PX = 1; // per minute

// The week of Einsätze and Sperren: a column per day on a time axis. The party is the strong
// part of a block, travel and setup around it the light part; a hold not yet paid is dashed.
// A click on free time opens „Zeit sperren“ for that day and hour.
export function WochenKalender({
  titel,
  tage,
  tagNamen,
  bloecke,
  infos,
  darsteller,
  gewaehlt,
  vorher,
  nachher,
  heute,
}: {
  titel: string;
  tage: string[];
  tagNamen: string[];
  bloecke: Block[][];
  infos: Record<string, BlockInfo>;
  darsteller: { id: number; name: string }[];
  gewaehlt: number | null;
  vorher: string;
  nachher: string;
  heute: string;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState(false);
  const [vorschlag, setVorschlag] = useState<SperreVorschlag>({});
  const ausloeser = useRef<HTMLElement | null>(null);

  const alle = bloecke.flat();
  const vonMin = Math.min(8 * 60, ...alle.map((b) => Math.floor(b.vonMin / 60) * 60));
  const bisMin = Math.max(21 * 60, ...alle.map((b) => Math.ceil(b.bisMin / 60) * 60));
  const stunden = Array.from({ length: (bisMin - vonMin) / 60 }, (_, i) => vonMin + i * 60);
  const hoehe = (bisMin - vonMin) * PX;

  const link = (woche: string, d: number | null) =>
    `/admin/buchung/kalender?woche=${woche}${d ? `&darsteller=${d}` : ""}`;

  const sperreAb = (tag: string, minuten: number) => {
    const von = Math.min(Math.round(minuten / 30) * 30, 23 * 60);
    setVorschlag({
      darstellerId: gewaehlt ?? undefined,
      vonTag: tag,
      vonZeit: ZEIT(von),
      bisTag: tag,
      bisZeit: ZEIT(Math.min(von + 120, 23 * 60 + 55)),
    });
    ausloeser.current = null;
    setDialog(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon-sm">
            <Link href={link(vorher, gewaehlt) as never} aria-label="Vorige Woche">
              <ChevronLeftIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={link(heute, gewaehlt) as never}>Heute</Link>
          </Button>
          <Button asChild variant="outline" size="icon-sm">
            <Link href={link(nachher, gewaehlt) as never} aria-label="Nächste Woche">
              <ChevronRightIcon />
            </Link>
          </Button>
          <h2 className="ml-3 text-lg font-semibold">{titel}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={gewaehlt ? String(gewaehlt) : "alle"}
            onValueChange={(v) =>
              router.push(link(tage[0]!, v === "alle" ? null : Number(v)) as never)
            }
          >
            <SelectTrigger className="w-48" aria-label="Darsteller">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Darsteller</SelectItem>
              {darsteller.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              ausloeser.current = e.currentTarget;
              setVorschlag({ darstellerId: gewaehlt ?? undefined, vonTag: tage[0] });
              setDialog(true);
            }}
            disabled={darsteller.length === 0}
          >
            <BanIcon data-icon="inline-start" /> Zeit sperren
          </Button>
          <Button asChild size="sm">
            <Link href={"/admin/buchung/buchungen/neu" as never}>
              <PlusIcon data-icon="inline-start" /> Neue Buchung
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <div className="grid min-w-[56rem] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="border-b" />
          {tage.map((tag, i) => (
            <div
              key={tag}
              className={cn(
                "border-b border-l px-2 py-2 text-sm",
                tag === heute && "bg-accent text-accent-foreground",
              )}
            >
              <span className="font-medium">{tagNamen[i]}</span>
            </div>
          ))}

          <div className="relative" style={{ height: hoehe }} aria-hidden="true">
            {stunden.map((m) => (
              <div
                key={m}
                className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums"
                style={{ top: (m - vonMin) * PX }}
              >
                {m > vonMin ? ZEIT(m) : ""}
              </div>
            ))}
          </div>

          {tage.map((tag, i) => (
            <div
              key={tag}
              className="relative cursor-copy border-l"
              style={{ height: hoehe }}
              onClick={(e) => {
                if (e.target !== e.currentTarget || darsteller.length === 0) return;
                const y = e.nativeEvent.offsetY;
                sperreAb(tag, vonMin + y / PX);
              }}
            >
              {stunden.map((m) => (
                <div
                  key={m}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/60"
                  style={{ top: (m - vonMin) * PX }}
                />
              ))}
              <ul role="list" aria-label={tagNamen[i]}>
                {bloecke[i]!.map((b) => {
                  const info = infos[b.key]!;
                  const top = (b.vonMin - vonMin) * PX;
                  const height = Math.max(24, (b.bisMin - b.vonMin) * PX);
                  const party =
                    b.partyVonMin !== undefined && b.partyBisMin !== undefined
                      ? {
                          top: (b.partyVonMin - b.vonMin) * PX,
                          height: (b.partyBisMin - b.partyVonMin) * PX,
                        }
                      : null;
                  const inhalt = (
                    <>
                      {party ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 rounded-sm bg-primary/85"
                          style={{ top: party.top, height: party.height }}
                        />
                      ) : null}
                      <span className="relative flex flex-col gap-0.5 p-1.5 text-[0.7rem] leading-tight">
                        <span className="line-clamp-2 font-medium">{info.titel}</span>
                        <span className="truncate opacity-80">{info.zeile}</span>
                      </span>
                      <span className="sr-only">{info.beschreibung}</span>
                    </>
                  );
                  const klasse = cn(
                    "absolute overflow-hidden rounded-md border text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    info.art === "sperre"
                      ? "border-border bg-muted [background-image:repeating-linear-gradient(45deg,transparent,transparent_6px,var(--border)_6px,var(--border)_7px)] text-muted-foreground"
                      : "border-primary/40 bg-primary/15 text-foreground",
                    info.reserviert && "border-dashed",
                  );
                  const stil = {
                    top,
                    height,
                    left: `calc(${(b.spur / b.spuren) * 100}% + 2px)`,
                    width: `calc(${100 / b.spuren}% - 4px)`,
                  };
                  return (
                    <li key={b.key}>
                      {info.href ? (
                        <Link href={info.href as never} className={klasse} style={stil}>
                          {inhalt}
                        </Link>
                      ) : (
                        <div className={klasse} style={stil}>
                          {inhalt}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Kräftig: die Feier. Blass: Fahrt, Umziehen und Abbau. Gestrichelt: reserviert, Anzahlung
        offen. Schraffiert: gesperrt. Ein Klick in eine freie Zeit sperrt sie.
      </p>

      <SperreDialog
        offen={dialog}
        onOffen={setDialog}
        vorschlag={vorschlag}
        darsteller={darsteller}
        ausloeser={ausloeser}
      />
    </div>
  );
}
