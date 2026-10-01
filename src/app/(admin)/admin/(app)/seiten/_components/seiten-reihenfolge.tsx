"use client";

import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon } from "lucide-react";
import { Reorder, useDragControls, useReducedMotion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ordnePagesAction } from "../../../_actions/pages";

export type ReihenSeite = { id: number; title: string; path: string };
export type ReihenGruppe = {
  parentId: number | null;
  titel: string;
  beschreibung: string;
  seiten: ReihenSeite[];
};

// The order of the site's navigation: each group of sibling pages as a list to drag by its
// handle or move with the arrow buttons. Every change is saved at once and announced.
export function SeitenReihenfolge({ gruppen }: { gruppen: ReihenGruppe[] }) {
  const [ansage, setAnsage] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <p aria-live="polite" className="sr-only">
        {ansage}
      </p>
      {gruppen.map((g, index) => (
        <Gruppe key={g.parentId ?? "oben"} gruppe={g} index={index} onAnsage={setAnsage} />
      ))}
    </div>
  );
}

function Gruppe({
  gruppe,
  index,
  onAnsage,
}: {
  gruppe: ReihenGruppe;
  index: number;
  onAnsage: (text: string) => void;
}) {
  const [seiten, setSeiten] = useState(gruppe.seiten);
  const [gespeichert, setGespeichert] = useState(gruppe.seiten.map((s) => s.id));

  const speichern = async (neu: ReihenSeite[]) => {
    const ids = neu.map((s) => s.id);
    if (ids.join() === gespeichert.join()) return;
    const result = await ordnePagesAction({ parentId: gruppe.parentId, ids });
    if (result?.serverError) {
      toast.error(result.serverError.message);
      setSeiten(
        gruppe.seiten
          .filter((s) => gespeichert.includes(s.id))
          .sort((a, b) => gespeichert.indexOf(a.id) - gespeichert.indexOf(b.id)),
      );
      return;
    }
    setGespeichert(ids);
    toast.success("Reihenfolge gespeichert. Die Navigation zeigt sie sofort.");
  };

  const schieben = (von: number, nach: number) => {
    if (nach < 0 || nach >= seiten.length) return;
    const neu = [...seiten];
    const [s] = neu.splice(von, 1);
    neu.splice(nach, 0, s!);
    setSeiten(neu);
    onAnsage(`${s!.title} steht jetzt an Stelle ${nach + 1} von ${neu.length}.`);
    void speichern(neu);
  };

  return (
    <Card className="rise-in" style={{ "--rise-index": index } as React.CSSProperties}>
      <CardHeader>
        <CardTitle>{gruppe.titel}</CardTitle>
        <CardDescription>{gruppe.beschreibung}</CardDescription>
      </CardHeader>
      <CardContent>
        <Reorder.Group
          axis="y"
          values={seiten}
          onReorder={setSeiten}
          className="flex flex-col gap-2"
          aria-label={gruppe.titel}
        >
          {seiten.map((s, i) => (
            <Zeile
              key={s.id}
              seite={s}
              stelle={i}
              anzahl={seiten.length}
              onSchieben={schieben}
              onLoslassen={() => void speichern(seiten)}
            />
          ))}
        </Reorder.Group>
      </CardContent>
    </Card>
  );
}

function Zeile({
  seite,
  stelle,
  anzahl,
  onSchieben,
  onLoslassen,
}: {
  seite: ReihenSeite;
  stelle: number;
  anzahl: number;
  onSchieben: (von: number, nach: number) => void;
  onLoslassen: () => void;
}) {
  const steuerung = useDragControls();
  const reduce = useReducedMotion();
  return (
    <Reorder.Item
      value={seite}
      dragListener={false}
      dragControls={steuerung}
      onDragEnd={onLoslassen}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 45 }}
      whileDrag={
        reduce ? undefined : { scale: 1.015, boxShadow: "0 12px 28px -12px oklch(0 0 0 / 0.5)" }
      }
      className="flex items-center gap-2 rounded-lg border bg-card px-2 py-2"
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onPointerDown={(e) => steuerung.start(e)}
        className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <span className="w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {stelle + 1}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{seite.title}</span>
        <span className="truncate font-mono text-xs text-muted-foreground">{seite.path}</span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={stelle === 0}
        aria-label={`${seite.title} nach oben`}
        onClick={() => onSchieben(stelle, stelle - 1)}
      >
        <ArrowUpIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={stelle === anzahl - 1}
        aria-label={`${seite.title} nach unten`}
        onClick={() => onSchieben(stelle, stelle + 1)}
      >
        <ArrowDownIcon />
      </Button>
    </Reorder.Item>
  );
}
