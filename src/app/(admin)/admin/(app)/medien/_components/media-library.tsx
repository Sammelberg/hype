"use client";

import { FolderIcon, ImageIcon, SearchIcon, Trash2Icon, UploadIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { MediaDoc, MediaVerwendung } from "@/cms/content/types";
import { cn } from "@/lib/utils";
import { deleteMediaAction, updateMediaAction } from "../../../_actions/media";

const size = (bytes: number) =>
  bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

function UploadForm({ ordner }: { ordner: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setBusy(true);
    const data = new FormData();
    for (const file of list) data.append("files", file);
    if (ordner) data.append("ordner", ordner);
    // A route of its own, not an action: see medien/hochladen/route.ts.
    const response = await fetch("/admin/medien/hochladen", { method: "POST", body: data }).catch(
      () => null,
    );
    setBusy(false);
    if (!response?.ok) {
      const body = (await response?.json().catch(() => null)) as { message?: string } | null;
      return void toast.error(
        body?.message ?? "Das Hochladen hat nicht geklappt. Bitte versuchen Sie es noch einmal.",
      );
    }
    toast.success(
      list.length === 1
        ? "Bild hochgeladen. Bitte beschreiben Sie es."
        : `${list.length} Bilder hochgeladen. Bitte beschreiben Sie sie.`,
    );
    if (input.current) input.current.value = "";
    router.refresh();
  };

  return (
    <div
      onDragOver={(e) => (e.preventDefault(), setDragging(true))}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => (e.preventDefault(), setDragging(false), void upload(e.dataTransfer.files))}
      data-dragging={dragging || undefined}
      className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors data-dragging:border-primary data-dragging:bg-accent/40"
    >
      <UploadIcon className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">Bilder hierher ziehen</p>
      <p className="text-sm text-muted-foreground">
        JPG, PNG, WebP, AVIF oder GIF, bis 20 MB. Die Größen für die Website entstehen beim
        Hochladen{ordner ? `; sie kommen in den Ordner „${ordner}“` : ""}.
      </p>
      <Input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        id="media-files"
        aria-label="Bilder auswählen"
        onChange={(e) => e.target.files && void upload(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? <Spinner data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" />}
        Dateien wählen
      </Button>
    </div>
  );
}

function EditDialog({
  item,
  ordnerListe,
  verwendung,
  onClose,
}: {
  item: MediaDoc | null;
  ordnerListe: string[];
  verwendung: MediaVerwendung[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [alt, setAlt] = useState(item?.alt ?? "");
  const [ordner, setOrdner] = useState(item?.ordner ?? "");
  const [focal, setFocal] = useState({ x: item?.focalX ?? 50, y: item?.focalY ?? 50 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!item) return null;

  const save = async () => {
    setBusy(true);
    const result = await updateMediaAction({
      id: item.id,
      alt,
      focalX: focal.x,
      focalY: focal.y,
      ordner: ordner || null,
    });
    setBusy(false);
    if (result.serverError) return setError(result.serverError.message);
    if (result.validationErrors) return setError("Bitte beschreiben Sie das Bild.");
    toast.success("Gespeichert.");
    onClose();
    router.refresh();
  };

  const remove = async () => {
    const result = await deleteMediaAction({ id: item.id });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Bild gelöscht.");
    onClose();
    router.refresh();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bild bearbeiten</DialogTitle>
          <DialogDescription>
            {item.filename} ·{" "}
            {item.width && item.height ? `${item.width} × ${item.height} px · ` : ""}
            {size(item.filesize)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="mb-2 text-sm font-medium">Bildmitte</p>
            <button
              type="button"
              className="relative block w-full overflow-hidden rounded-lg border bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Bildmitte setzen: Klicken Sie auf die Stelle, die beim Zuschneiden sichtbar bleiben soll"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setFocal({
                  x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
                  y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
                });
              }}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 2;
                const moves: Record<string, [number, number]> = {
                  ArrowLeft: [-step, 0],
                  ArrowRight: [step, 0],
                  ArrowUp: [0, -step],
                  ArrowDown: [0, step],
                };
                const move = moves[e.key];
                if (!move) return;
                e.preventDefault();
                setFocal((f) => ({
                  x: Math.min(100, Math.max(0, f.x + move[0])),
                  y: Math.min(100, Math.max(0, f.y + move[1])),
                }));
              }}
            >
              <Image
                src={item.sizes.card?.url ?? item.url}
                alt=""
                width={item.width ?? 800}
                height={item.height ?? 600}
                className="h-auto w-full"
              />
              <span
                aria-hidden="true"
                className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary/60 shadow transition-[left,top] duration-150 ease-out"
                style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
              />
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              Klicken oder mit den Pfeiltasten verschieben. Diese Stelle bleibt sichtbar, wenn ein
              Ausschnitt gezeigt wird ({focal.x} % / {focal.y} %).
            </p>
          </div>
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="media-alt">Beschreibung</FieldLabel>
              <Input
                id="media-alt"
                value={alt}
                onChange={(e) => (setAlt(e.target.value), setError(null))}
                aria-invalid={error ? true : undefined}
                maxLength={500}
              />
              <FieldDescription>
                Was auf dem Bild zu sehen ist — für Menschen, die es nicht sehen, und für
                Suchmaschinen.
              </FieldDescription>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="media-ordner">Ordner</FieldLabel>
              <Input
                id="media-ordner"
                value={ordner}
                list="media-ordner-liste"
                maxLength={100}
                placeholder="Ohne Ordner"
                onChange={(e) => setOrdner(e.target.value)}
              />
              <datalist id="media-ordner-liste">
                {ordnerListe.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
              <FieldDescription>Ein bestehender oder ein neuer Name.</FieldDescription>
            </Field>
            <div className="flex flex-col gap-1.5 text-sm">
              <p className="font-medium">Verwendet</p>
              {verwendung.length === 0 ? (
                <p className="text-muted-foreground">Noch nirgends als Vorschaubild.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {verwendung.map((v) => (
                    <li key={`${v.art}-${v.id}`}>
                      <Link
                        href={
                          `/admin/${v.art === "seite" ? "seiten" : "projekte"}/${v.id}` as never
                        }
                        className="underline underline-offset-2"
                      >
                        {v.titel}
                      </Link>
                      <span className="text-muted-foreground">
                        {" "}
                        ({v.art === "seite" ? "Seite" : "Projekt"}
                        {v.entwurf ? ", im Entwurf" : ""})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </FieldGroup>
        </div>
        <DialogFooter className="sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <Trash2Icon data-icon="inline-start" /> Löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bild löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  {verwendung.length > 0
                    ? `Es ist Vorschaubild von ${verwendung.map((v) => v.titel).join(", ")}; dort erscheint danach wieder das gezeichnete Bild.`
                    : "Es wird nirgends verwendet."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => void remove()}>
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="button" onClick={() => void save()} disabled={busy}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const OHNE = "\u0000ohne";

export function MediaLibrary({
  media,
  verwendung,
}: {
  media: MediaDoc[];
  verwendung: Record<number, MediaVerwendung[]>;
}) {
  const [editing, setEditing] = useState<MediaDoc | null>(null);
  const [suche, setSuche] = useState("");
  const [ordner, setOrdner] = useState<string | null>(null);
  const ordnerListe = useMemo(
    () =>
      [...new Set(media.map((m) => m.ordner).filter((o): o is string => Boolean(o)))].sort((a, b) =>
        a.localeCompare(b, "de"),
      ),
    [media],
  );
  const q = suche.trim().toLowerCase();
  const sichtbar = media.filter(
    (m) =>
      (ordner === null || (ordner === OHNE ? !m.ordner : m.ordner === ordner)) &&
      (!q || m.alt.toLowerCase().includes(q) || m.filename.toLowerCase().includes(q)),
  );
  const chip = (wert: string | null, label: string, anzahl: number) => (
    <Button
      key={wert ?? "alle"}
      type="button"
      size="sm"
      variant={ordner === wert ? "default" : "ghost"}
      aria-pressed={ordner === wert}
      onClick={() => setOrdner(wert)}
    >
      {wert && wert !== OHNE ? <FolderIcon data-icon="inline-start" /> : null}
      {label} <span className="tabular-nums opacity-70">{anzahl}</span>
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <UploadForm ordner={ordner && ordner !== OHNE ? ordner : null} />
      {media.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon />
            </EmptyMedia>
            <EmptyTitle>Noch keine Bilder</EmptyTitle>
            <EmptyDescription>
              Hochgeladene Bilder lassen sich als Vorschaubild einer Seite oder eines Projekts
              wählen.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
                placeholder="Beschreibung oder Dateiname"
                aria-label="Bilder durchsuchen"
                className="pl-8"
              />
            </div>
            {ordnerListe.length > 0 ? (
              <nav aria-label="Ordner" className="flex flex-wrap gap-1">
                {chip(null, "Alle", media.length)}
                {ordnerListe.map((o) => chip(o, o, media.filter((m) => m.ordner === o).length))}
                {media.some((m) => !m.ordner)
                  ? chip(OHNE, "Ohne Ordner", media.filter((m) => !m.ordner).length)
                  : null}
              </nav>
            ) : null}
          </div>
          {sichtbar.length === 0 ? (
            <p className="text-sm text-muted-foreground">Kein Bild passt dazu.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {sichtbar.map((item, index) => {
                const benutzt = verwendung[item.id]?.length ?? 0;
                return (
                  <li
                    key={item.id}
                    className="rise-in"
                    style={{ "--rise-index": Math.min(index, 12) } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="group block w-full overflow-hidden rounded-lg border bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label={`${item.alt || item.filename} bearbeiten`}
                    >
                      <span className="relative block aspect-4/3">
                        <Image
                          src={item.sizes.thumbnail?.url ?? item.url}
                          alt=""
                          fill
                          sizes="(min-width: 1536px) 16vw, (min-width: 1024px) 25vw, 50vw"
                          className="object-cover transition-transform duration-300 ease-(--ease-out-strong) group-hover:scale-[1.03]"
                          style={{ objectPosition: `${item.focalX}% ${item.focalY}%` }}
                        />
                      </span>
                      <span className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                        <span className="truncate">{item.alt || item.filename}</span>
                        <span
                          className={cn(
                            "shrink-0",
                            benutzt > 0 ? "text-primary-soft" : "opacity-60",
                          )}
                        >
                          {benutzt > 0 ? `${benutzt}× genutzt` : "frei"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <EditDialog
        key={editing?.id ?? "none"}
        item={editing}
        ordnerListe={ordnerListe}
        verwendung={editing ? (verwendung[editing.id] ?? []) : []}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
