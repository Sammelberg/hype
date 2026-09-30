"use client";

import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
import type { MediaDoc } from "@/cms/content/types";
import { deleteMediaAction, updateMediaAction } from "../../../_actions/media";

const size = (bytes: number) =>
  bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

function UploadForm() {
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
        JPG, PNG, WebP, AVIF, GIF oder SVG, bis 20 MB. Die Größen für die Website entstehen beim
        Hochladen.
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

function EditDialog({ item, onClose }: { item: MediaDoc | null; onClose: () => void }) {
  const router = useRouter();
  const [alt, setAlt] = useState(item?.alt ?? "");
  const [focal, setFocal] = useState({ x: item?.focalX ?? 50, y: item?.focalY ?? 50 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!item) return null;

  const save = async () => {
    setBusy(true);
    const result = await updateMediaAction({ id: item.id, alt, focalX: focal.x, focalY: focal.y });
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
                  Seiten, die es als Vorschaubild nutzen, zeigen danach wieder das gezeichnete Bild.
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

export function MediaLibrary({ media }: { media: MediaDoc[] }) {
  const [editing, setEditing] = useState<MediaDoc | null>(null);
  return (
    <div className="flex flex-col gap-8">
      <UploadForm />
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
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {media.map((item, index) => (
            <li
              key={item.id}
              className="rise-in"
              style={{ "--rise-index": index } as React.CSSProperties}
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
                <span className="block truncate px-2 py-1.5 text-xs text-muted-foreground">
                  {item.alt || item.filename}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <EditDialog key={editing?.id ?? "none"} item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
