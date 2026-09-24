"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, type ReactNode } from "react";

import { submitContact, type ContactState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prefillValues } from "../_lib/prefill";
import { HONEYPOT, STARTED_AT, type ContactField } from "../_lib/validation";
import { cn } from "@/lib/utils";

export type ContactFormField = ContactField & { width?: number | null };

const SUPPORTED = new Set(["text", "email", "textarea", "number", "select", "checkbox"]);

export function ContactForm({
  fields,
  submitLabel,
  confirmation,
  contactEmail,
  renderedAt,
}: {
  fields: ContactFormField[];
  submitLabel: string;
  confirmation: ReactNode;
  contactEmail?: string | null;
  /** Server render time; replaced by the mount time once JS runs (see _lib/validation.ts). */
  renderedAt: number;
}) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, {
    status: "idle",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const startedRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
    // Start values from the link (homepage configurator); never overwrite what is already typed.
    for (const [name, value] of Object.entries(prefillValues(window.location.search, fields))) {
      const input = formRef.current?.elements.namedItem(name);
      if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
        if (!input.value) input.value = value;
      }
    }
    // Runs once on mount: later field changes must not refill the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.status === "success" || state.status === "error") statusRef.current?.focus();
    if (state.status === "invalid") {
      const first = Object.keys(state.errors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="outline-none">
        {confirmation}
      </div>
    );
  }

  const errors = state.status === "invalid" ? state.errors : {};
  const values = state.status === "invalid" ? state.values : {};
  const visible = fields.filter((field) => SUPPORTED.has(field.blockType));

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      aria-busy={pending}
      className="grid gap-5 sm:grid-cols-2"
    >
      <p className="text-sm text-muted-foreground sm:col-span-2">
        Mit <span aria-hidden="true">*</span> markierte Felder sind Pflichtfelder.
      </p>

      {visible.map((field) => {
        const id = `kontakt-${field.name}`;
        const error = errors[field.name];
        const describedBy = error ? `${id}-fehler` : undefined;
        const common = {
          id,
          name: field.name,
          required: Boolean(field.required),
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
        };
        const half = field.width === 50 && field.blockType !== "textarea";
        const label = (
          <>
            {field.label || field.name}
            {field.required ? <span aria-hidden="true"> *</span> : null}
          </>
        );

        return (
          <div
            key={field.name}
            className={cn("grid content-start gap-2", !half && "sm:col-span-2")}
          >
            {field.blockType === "checkbox" ? (
              <div className="flex items-center gap-2">
                <input
                  {...common}
                  type="checkbox"
                  defaultChecked={values[field.name] === "on"}
                  className="size-4 accent-primary"
                />
                <Label htmlFor={id}>{label}</Label>
              </div>
            ) : (
              <>
                <Label htmlFor={id}>{label}</Label>
                {field.blockType === "textarea" ? (
                  <Textarea {...common} rows={6} defaultValue={values[field.name]} />
                ) : field.blockType === "select" ? (
                  <select
                    {...common}
                    defaultValue={values[field.name] ?? ""}
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">Bitte wählen</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    {...common}
                    type={
                      field.blockType === "email"
                        ? "email"
                        : field.blockType === "number"
                          ? "number"
                          : "text"
                    }
                    autoComplete={
                      field.blockType === "email"
                        ? "email"
                        : field.name === "name"
                          ? "name"
                          : undefined
                    }
                    defaultValue={values[field.name]}
                  />
                )}
              </>
            )}
            {error ? (
              <p id={describedBy} className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}

      {/* Honeypot: invisible and unreachable for people, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={HONEYPOT}>Website (bitte leer lassen)</label>
        <input id={HONEYPOT} name={HONEYPOT} type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={startedRef} type="hidden" name={STARTED_AT} defaultValue={renderedAt} />

      {state.status === "error" ? (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="alert"
          className="text-sm text-destructive outline-none sm:col-span-2"
        >
          Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut
          {contactEmail ? (
            <>
              {" "}
              oder schreiben Sie an{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="underline decoration-primary-soft underline-offset-4 transition-colors hover:text-primary-soft"
              >
                {contactEmail}
              </a>
            </>
          ) : null}
          .
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gesendet …" : submitLabel}
        </Button>
        <p className="text-sm text-muted-foreground">
          Hinweise zur Verarbeitung Ihrer Angaben finden Sie in der{" "}
          <Link
            href={"/datenschutz" as never}
            className="underline decoration-primary-soft underline-offset-4 transition-colors hover:text-primary-soft"
          >
            Datenschutzerklärung
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
