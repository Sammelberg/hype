"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightLeftIcon,
  CornerDownRightIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Page, Projekt, Redirect, RedirectInput } from "@/cms/content/types";
import { RedirectInputSchema } from "@/cms/content/types";
import {
  createRedirectAction,
  deleteRedirectAction,
  updateRedirectAction,
} from "../../../_actions/redirects";

type Target = "page" | "projekt" | "url";

const targetOf = (r: Redirect | null): Target =>
  r?.toProjektId ? "projekt" : r?.toUrl ? "url" : "page";

function RedirectForm({
  redirect,
  pages,
  projekte,
  onDone,
}: {
  redirect: Redirect | null;
  pages: Page[];
  projekte: Projekt[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<Target>(targetOf(redirect));
  const [busy, setBusy] = useState(false);
  const form = useForm<RedirectInput>({
    resolver: zodResolver(RedirectInputSchema),
    defaultValues: redirect
      ? {
          from: redirect.from,
          type: redirect.type,
          toPageId: redirect.toPageId,
          toProjektId: redirect.toProjektId,
          toUrl: redirect.toUrl,
        }
      : { from: "", type: 308, toPageId: pages[0]?.id ?? null, toProjektId: null, toUrl: null },
  });
  const { control, handleSubmit, setValue, setError } = form;
  const type = useWatch({ control, name: "type" });

  const changeTarget = (next: Target) => {
    if (!next) return;
    setTarget(next);
    setValue("toPageId", next === "page" ? (pages[0]?.id ?? null) : null);
    setValue("toProjektId", next === "projekt" ? (projekte[0]?.id ?? null) : null);
    setValue("toUrl", next === "url" ? "" : null);
  };

  const submit = handleSubmit(async (input) => {
    setBusy(true);
    const result = redirect
      ? await updateRedirectAction({ id: redirect.id, input })
      : await createRedirectAction(input);
    setBusy(false);
    if (result.serverError) {
      if (result.serverError.field)
        setError(result.serverError.field as keyof RedirectInput, {
          message: result.serverError.message,
        });
      return void toast.error(result.serverError.message);
    }
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die Felder.");
    toast.success(redirect ? "Weiterleitung gespeichert." : "Weiterleitung angelegt.");
    onDone();
    router.refresh();
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <Controller
          control={control}
          name="from"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="redirect-from">Alter Pfad</FieldLabel>
              <Input
                id="redirect-from"
                {...field}
                placeholder="/alte-seite"
                className="font-mono"
                aria-invalid={fieldState.invalid || undefined}
              />
              <FieldDescription>
                Wer diese Adresse aufruft, landet am Ziel. Groß-/Kleinschreibung spielt keine Rolle.
              </FieldDescription>
              {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
            </Field>
          )}
        />
        <Field>
          <FieldLabel>Ziel</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={target}
            onValueChange={(v) => changeTarget(v as Target)}
            aria-label="Art des Ziels"
          >
            <ToggleGroupItem value="page">Seite</ToggleGroupItem>
            <ToggleGroupItem value="projekt" disabled={projekte.length === 0}>
              Projekt
            </ToggleGroupItem>
            <ToggleGroupItem value="url">Adresse</ToggleGroupItem>
          </ToggleGroup>
        </Field>
        {target === "page" ? (
          <Controller
            control={control}
            name="toPageId"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="redirect-page">Seite</FieldLabel>
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger id="redirect-page">
                    <SelectValue placeholder="Seite wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {pages.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.title} <span className="text-muted-foreground">{p.path}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        ) : null}
        {target === "projekt" ? (
          <Controller
            control={control}
            name="toProjektId"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="redirect-projekt">Projekt</FieldLabel>
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger id="redirect-projekt">
                    <SelectValue placeholder="Projekt wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {projekte.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        ) : null}
        {target === "url" ? (
          <Controller
            control={control}
            name="toUrl"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="redirect-url">Adresse</FieldLabel>
                <Input
                  id="redirect-url"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="https://… oder /pfad"
                  aria-invalid={fieldState.invalid || undefined}
                />
                {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
              </Field>
            )}
          />
        ) : null}
        <Field>
          <FieldLabel>Art</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={String(type)}
            onValueChange={(v) => v && setValue("type", Number(v) as 308 | 307)}
            aria-label="Art der Weiterleitung"
          >
            <ToggleGroupItem value="308">Dauerhaft (308)</ToggleGroupItem>
            <ToggleGroupItem value="307">Vorübergehend (307)</ToggleGroupItem>
          </ToggleGroup>
          <FieldDescription>
            Dauerhaft sagt Suchmaschinen, dass die alte Adresse ersetzt ist (308 wirkt wie 301).
          </FieldDescription>
        </Field>
      </FieldGroup>
      <SheetFooter className="px-0">
        <Button type="submit" disabled={busy}>
          {busy ? <Spinner data-icon="inline-start" /> : null}
          {redirect ? "Speichern" : "Anlegen"}
        </Button>
      </SheetFooter>
    </form>
  );
}

export function RedirectsManager({
  redirects,
  pages,
  projekte,
}: {
  redirects: Redirect[];
  pages: Page[];
  projekte: Projekt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Redirect | null>(null);

  const remove = async (id: number) => {
    const result = await deleteRedirectAction({ id });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Weiterleitung gelöscht.");
    router.refresh();
  };

  const newButton = (
    <Button size="sm" onClick={() => (setEditing(null), setOpen(true))}>
      <PlusIcon data-icon="inline-start" /> Neue Weiterleitung
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">{newButton}</div>
      {redirects.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ArrowRightLeftIcon />
            </EmptyMedia>
            <EmptyTitle>Keine Weiterleitungen</EmptyTitle>
            <EmptyDescription>
              Wenn eine Adresse sich ändert, führt eine Weiterleitung alte Links ans neue Ziel.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{newButton}</EmptyContent>
        </Empty>
      ) : (
        <div className="@container">
          <ul role="list" className="grid items-start gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
            {redirects.map((r, index) => (
              <li
                key={r.id}
                className="rise-in"
                style={{ "--rise-index": index } as React.CSSProperties}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="truncate font-mono text-base">{r.from}</CardTitle>
                    <CardAction>
                      <Badge variant="outline" className="text-muted-foreground">
                        {r.type === 308 ? "dauerhaft · 308" : "vorübergehend · 307"}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <CornerDownRightIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary-soft"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="sr-only">führt zu</span>
                      <span className="truncate font-medium">
                        {r.targetLabel ?? "Kein Ziel mehr"}
                      </span>
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {r.destination ?? "Das Ziel wurde gelöscht."}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${r.from} bearbeiten`}
                      onClick={() => (setEditing(r), setOpen(true))}
                    >
                      <PencilIcon data-icon="inline-start" /> Bearbeiten
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" aria-label={`${r.from} löschen`}>
                          <Trash2Icon data-icon="inline-start" /> Löschen
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Weiterleitung löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {r.from} führt danach ins Leere (404).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => void remove(r.id)}
                          >
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? "Weiterleitung bearbeiten" : "Neue Weiterleitung"}</SheetTitle>
            <SheetDescription>
              Von einem alten Pfad zu einer Seite, einem Projekt oder einer beliebigen Adresse.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            {open ? (
              <RedirectForm
                key={editing?.id ?? "new"}
                redirect={editing}
                pages={pages}
                projekte={projekte}
                onDone={() => setOpen(false)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
