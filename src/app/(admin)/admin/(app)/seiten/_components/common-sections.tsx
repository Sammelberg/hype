"use client";

import { ArrowUpRightIcon, FileTextIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { canMove, flattenTree, pathOf, PROTECTED_SLUGS, slugify } from "@/cms/content/page-tree";
import { CardLink, tileLinkSurface } from "../../../_components/card-link";
import { LexicalEditor } from "../../../_components/lexical-editor/editor";
import { SectionCard } from "../../../_components/sections";
import { SeoFields } from "../../../_components/seo-fields";
import { StatusBadge } from "../../../_components/status-badge";
import type { EditorContext } from "./editor-context";

// Title and lead: the head of every page but the home page (PageHeader on the site).
export function HeadSection({ ctx, description }: { ctx: EditorContext; description?: string }) {
  const { control, setValue, slugTouched, page } = ctx;
  const fixed = page ? PROTECTED_SLUGS.has(page.slug) : false;
  return (
    <SectionCard
      section={{ id: "kopf", title: "Kopfbereich", zone: "kopf" }}
      description={
        description ??
        (fixed && page
          ? `Überschrift und Einleitung oben auf ${page.path}. Die Adresse dieser Seite ist fest.`
          : "Überschrift und Einleitung oben auf der Seite.")
      }
    >
      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="page-title">Titel</FieldLabel>
            <Input
              id="page-title"
              {...field}
              className="h-10 text-lg font-medium"
              aria-invalid={fieldState.invalid || undefined}
              onChange={(e) => {
                field.onChange(e);
                if (!slugTouched && !fixed)
                  setValue("slug", slugify(e.target.value), { shouldDirty: true });
              }}
            />
            <FieldDescription>Auch im Menü, im Seitentitel und in der Übersicht.</FieldDescription>
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="lead"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="page-lead">Einleitung</FieldLabel>
            <Textarea
              id="page-lead"
              {...field}
              value={field.value ?? ""}
              rows={3}
              aria-invalid={fieldState.invalid || undefined}
            />
            <FieldDescription>
              Neben der Überschrift; leer bleibt die Überschrift allein.
            </FieldDescription>
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </Field>
        )}
      />
    </SectionCard>
  );
}

export function TextSection({ ctx }: { ctx: EditorContext }) {
  return (
    <SectionCard
      section={{ id: "text", title: "Text", zone: "text" }}
      description="Der Inhalt der Seite: Absätze, Zwischenüberschriften, Listen, Zitate und Links."
    >
      <Controller
        control={ctx.control}
        name="content"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="page-content" className="sr-only">
              Text
            </FieldLabel>
            <LexicalEditor
              key={ctx.editorKey}
              id="page-content"
              label="Text der Seite"
              value={field.value}
              onChange={field.onChange}
              invalid={fieldState.invalid}
            />
          </Field>
        )}
      />
    </SectionCard>
  );
}

// The pages below this one, each a tile that opens it; a new one starts below this page.
export function ChildrenSection({
  ctx,
  title = "Seiten darunter",
  description = "Stehen im Menü unter dieser Seite und am Ende ihres Textes.",
}: {
  ctx: EditorContext;
  title?: string;
  description?: string;
}) {
  const { page, pages } = ctx;
  if (!page) return null;
  const children = pages.filter((p) => p.parent === page.id);
  return (
    <SectionCard
      section={{ id: "unterseiten", title }}
      description={description}
      action={
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/seiten/neu?unter=${page.id}` as never}>
            <PlusIcon data-icon="inline-start" /> Seite darunter
          </Link>
        </Button>
      }
    >
      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Seite darunter.</p>
      ) : (
        <div className="@container">
          <ul role="list" className="grid gap-2 @xl:grid-cols-2">
            {children.map((child) => (
              <li
                key={child.id}
                className={`${tileLinkSurface} flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileTextIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="flex min-w-0 flex-col">
                    <CardLink
                      tile
                      href={`/admin/seiten/${child.id}`}
                      className="truncate font-medium"
                    >
                      {child.title}
                    </CardLink>
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {child.path}
                    </span>
                  </div>
                </div>
                <StatusBadge status={child.status} hasDraft={child.hasDraft} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

// The closing invitation is the same on every page: shown here, edited under „Website“.
export function ClosingSection({ ctx }: { ctx: EditorContext }) {
  return (
    <SectionCard
      section={{ id: "anfrage", title: "Abschluss „Anfrage“", zone: "anfrage" }}
      description="Steht am Ende jeder Inhaltsseite gleich. Sie ändern ihn einmal für alle unter „Website“."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href={"/admin/einstellungen#abschnitt-anfrage" as never}>
            Unter Website ändern <ArrowUpRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      }
    >
      {ctx.cta ? (
        <blockquote className="rounded-lg border-l-4 border-primary/40 bg-muted/40 px-4 py-3">
          <p className="font-medium text-pretty">{ctx.cta.title}</p>
          {ctx.cta.text ? (
            <p className="mt-1 text-sm text-pretty text-muted-foreground">{ctx.cta.text}</p>
          ) : null}
          <p className="mt-2 text-sm">
            Schaltfläche: <span className="font-medium">{ctx.cta.label}</span>
          </p>
        </blockquote>
      ) : null}
    </SectionCard>
  );
}

export function SeoSection({ ctx }: { ctx: EditorContext }) {
  return (
    <SectionCard
      section={{ id: "suchmaschinen", title: "Suchmaschinen und Teilen" }}
      description="Nicht auf der Seite selbst: was Google und Messenger zeigen. Leer gilt der Titel und die Einleitung."
    >
      <SeoFields
        control={ctx.control}
        media={ctx.media}
        fallbackTitle={ctx.values.title || "Titel der Seite"}
      />
    </SectionCard>
  );
}

// Pages whose route shows no pages below them: nothing can be placed under these.
const NO_CHILDREN = new Set(["startseite", "projekte", "kontakt", "impressum", "datenschutz"]);

// Where the page lives: below which page, under which address. Fixed pages have no such card.
export function AddressSection({ ctx }: { ctx: EditorContext }) {
  const { control, page, pages, values, touchSlug } = ctx;
  const tree = pages.map((p) => ({ id: p.id, slug: p.slug, title: p.title, parentId: p.parent }));
  const parentOptions = flattenTree(tree, (a, b) => a.id - b.id).filter(
    (n) =>
      !NO_CHILDREN.has(n.slug) && (!page || (n.id !== page.id && canMove(page.id, n.id, tree))),
  );
  const parentPath = values.parentId
    ? (pages.find((p) => p.id === values.parentId)?.path ?? null)
    : null;
  const path = pathOf(values.slug || "seite", parentPath);
  return (
    <SectionCard
      section={{ id: "adresse", title: "Adresse und Ordnung" }}
      description="Wo die Seite im Menü steht und unter welcher Adresse sie erreichbar ist."
    >
      <Controller
        control={control}
        name="parentId"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="page-parent">Liegt unter</FieldLabel>
            <Select
              value={field.value ? String(field.value) : "none"}
              onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
            >
              <SelectTrigger id="page-parent" className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">Oberste Ebene (eigener Menüpunkt)</SelectItem>
                  {parentOptions.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>
                      {"  ".repeat(n.depth)}
                      {n.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              Eine Seite unter einer anderen erscheint in deren Menü und bekommt deren Adresse
              vorangestellt.
            </FieldDescription>
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="slug"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="page-slug">Adresse</FieldLabel>
            <Input
              id="page-slug"
              {...field}
              className="max-w-md font-mono"
              aria-invalid={fieldState.invalid || undefined}
              onChange={(e) => {
                touchSlug();
                field.onChange(e);
              }}
            />
            <FieldDescription>
              Wird zu <code className="rounded bg-muted px-1">{path}</code>. Kleinbuchstaben,
              Ziffern und Bindestriche.
            </FieldDescription>
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </Field>
        )}
      />
    </SectionCard>
  );
}
