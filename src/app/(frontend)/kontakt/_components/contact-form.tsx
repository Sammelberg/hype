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

import styles from "./contact-form.module.css";

export type ContactFormField = ContactField & { width?: number | null };

const SUPPORTED = new Set(["text", "email", "textarea", "number", "select", "checkbox"]);

export function ContactForm({
  fields,
  submitLabel,
  confirmation,
  contactEmail,
  startToken,
}: {
  fields: ContactFormField[];
  submitLabel: string;
  confirmation: ReactNode;
  contactEmail?: string | null;
  /** The start time the server signed for this visit (see _lib/form-token.ts). */
  startToken: string;
}) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, {
    status: "idle",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    if (state.status === "success" || state.status === "error" || state.status === "limited")
      statusRef.current?.focus();
    if (state.status === "invalid") {
      const first = Object.keys(state.errors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="outline-none">
        {/* A ring that closes and a tick that draws: the message has arrived. */}
        <svg viewBox="0 0 56 56" aria-hidden="true" className={styles.sent}>
          <circle cx="28" cy="28" r="26" pathLength={1} />
          <path d="M17 29l7.5 7.5L40 21" pathLength={1} />
        </svg>
        <div className="mt-6">{confirmation}</div>
      </div>
    );
  }

  const errors = state.status === "invalid" ? state.errors : {};
  const values = state.status === "invalid" || state.status === "limited" ? state.values : {};
  const visible = fields.filter((field) => SUPPORTED.has(field.blockType));

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      aria-busy={pending}
      className="grid gap-6 sm:grid-cols-2"
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
                <Label htmlFor={id} className="text-base">
                  {label}
                </Label>
                {field.blockType === "textarea" ? (
                  <Textarea
                    {...common}
                    rows={8}
                    defaultValue={values[field.name]}
                    className="min-h-40 bg-background/60 text-base transition-[border-color,box-shadow] duration-200 focus-visible:border-primary-soft md:text-base"
                  />
                ) : field.blockType === "select" ? (
                  <select
                    {...common}
                    defaultValue={values[field.name] ?? ""}
                    className="h-12 rounded-md border border-input bg-background/60 px-3 text-base transition-[border-color,box-shadow] duration-200 outline-none focus-visible:border-primary-soft focus-visible:ring-3 focus-visible:ring-ring/50"
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
                    className="h-12 bg-background/60 text-base transition-[border-color,box-shadow] duration-200 focus-visible:border-primary-soft md:text-base"
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
      <input type="hidden" name={STARTED_AT} defaultValue={startToken} />

      {state.status === "error" || state.status === "limited" ? (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="alert"
          className="text-sm text-destructive outline-none sm:col-span-2"
        >
          {state.status === "limited"
            ? `Von Ihrem Anschluss kamen gerade mehrere Nachrichten. Bitte versuchen Sie es in ${state.minutes} ${state.minutes === 1 ? "Minute" : "Minuten"} noch einmal`
            : "Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut"}
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
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="group h-12 gap-3 px-7 text-base"
        >
          {pending ? "Wird gesendet …" : submitLabel}
          <svg
            viewBox="0 0 28 28"
            aria-hidden="true"
            className="size-5 fill-none stroke-current stroke-2 transition-transform duration-200 ease-out [stroke-linecap:round] [stroke-linejoin:round] group-hover:translate-x-1 group-disabled:translate-x-0"
          >
            <path d="M5 14h17M16 8l6 6-6 6" />
          </svg>
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
