"use client";

import { ImageIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import type { MediaDoc } from "@/cms/content/types";

// Choose one image from the library (or none). Uploading new files happens under „Medien“.
export function MediaPicker({
  media,
  value,
  onChange,
  label = "Bild",
}: {
  media: MediaDoc[];
  value: number | null | undefined;
  onChange: (id: number | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const chosen = media.find((m) => m.id === value) ?? null;
  const shown = media.filter(
    (m) =>
      !query ||
      m.alt.toLowerCase().includes(query.toLowerCase()) ||
      m.filename.includes(query.toLowerCase()),
  );

  return (
    <div className="flex items-start gap-3">
      {chosen ? (
        <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
          <Image
            src={chosen.sizes.thumbnail?.url ?? chosen.url}
            alt={chosen.alt}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="grid size-24 shrink-0 place-items-center rounded-lg border border-dashed text-muted-foreground">
          <ImageIcon aria-hidden="true" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {chosen ? chosen.alt : `Kein ${label} gewählt.`}
        </p>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                {chosen ? "Anderes wählen" : `${label} wählen`}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{label} wählen</DialogTitle>
                <DialogDescription>
                  Aus den hochgeladenen Bildern. Neue Bilder laden Sie unter „Medien“ hoch.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nach Beschreibung suchen …"
                aria-label="Bilder durchsuchen"
              />
              {shown.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ImageIcon />
                    </EmptyMedia>
                    <EmptyTitle>Keine Bilder</EmptyTitle>
                    <EmptyDescription>
                      {media.length === 0 ? "Noch nichts hochgeladen." : "Nichts passt zur Suche."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {shown.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => (onChange(m.id), setOpen(false))}
                        aria-pressed={m.id === value}
                        className="group relative block aspect-square w-full overflow-hidden rounded-lg border bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:ring-2 aria-pressed:ring-primary"
                      >
                        <Image
                          src={m.sizes.thumbnail?.url ?? m.url}
                          alt={m.alt}
                          fill
                          sizes="200px"
                          className="object-cover transition-transform duration-300 ease-(--ease-out-strong) group-hover:scale-[1.03]"
                        />
                      </button>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{m.alt}</p>
                    </li>
                  ))}
                </ul>
              )}
            </DialogContent>
          </Dialog>
          {chosen ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <XIcon data-icon="inline-start" /> Entfernen
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
