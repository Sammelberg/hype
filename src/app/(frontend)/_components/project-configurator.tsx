"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

import { buildInquiry, inquiryHref } from "../_lib/inquiry";
import { usePauseOffscreen } from "../_lib/use-pause-offscreen";

const SCOPES = ["Wenige Seiten", "Eine mittelgroße Website", "Ein größeres Portal"];
const TIMINGS = ["So bald wie möglich", "In den nächsten drei Monaten", "Noch offen"];

// Three quick questions that write the start of a contact message. The button carries it to
// /kontakt, where the form picks it up (kontakt/_lib/prefill.ts). Native checkboxes and radios,
// styled as chips, so keyboard and screen readers work without extra ARIA.
export function ProjectConfigurator({ services }: { services: string[] }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const caret = usePauseOffscreen<HTMLSpanElement>();
  const [scope, setScope] = useState<string>();
  const [timing, setTiming] = useState<string>();

  const message = buildInquiry({
    services: services.filter((s) => chosen.includes(s)),
    scope,
    timing,
  });
  const touched = chosen.length > 0 || Boolean(scope) || Boolean(timing);

  const toggle = (service: string) =>
    setChosen((list) =>
      list.includes(service) ? list.filter((s) => s !== service) : [...list, service],
    );
  const reset = () => {
    setChosen([]);
    setScope(undefined);
    setTiming(undefined);
  };

  return (
    <div className="grid items-start gap-fib-xl lg:grid-cols-golden">
      <div className="grid gap-fib-xl">
        {services.length > 0 ? (
          <Question legend="Was brauchen Sie?" hint="Mehrfachauswahl möglich">
            {services.map((service) => (
              <Chip
                key={service}
                type="checkbox"
                name="leistung"
                label={service}
                checked={chosen.includes(service)}
                onChange={() => toggle(service)}
              />
            ))}
          </Question>
        ) : null}
        <Question legend="Wie groß ist das Vorhaben?">
          {SCOPES.map((option) => (
            <Chip
              key={option}
              type="radio"
              name="umfang"
              label={option}
              checked={scope === option}
              onChange={() => setScope(option)}
            />
          ))}
        </Question>
        <Question legend="Wann soll es losgehen?">
          {TIMINGS.map((option) => (
            <Chip
              key={option}
              type="radio"
              name="zeitrahmen"
              label={option}
              checked={timing === option}
              onChange={() => setTiming(option)}
            />
          ))}
        </Question>
      </div>

      <div className="rounded-2xl border bg-card p-fib-lg lg:sticky lg:top-[calc(var(--spacing-header)+var(--spacing-fib-lg))]">
        <h3 className="text-sm font-medium text-muted-foreground">Ihre Nachricht beginnt so</h3>
        <p
          aria-live="polite"
          className="mt-fib-md min-h-40 text-lg text-pretty whitespace-pre-line"
        >
          {message}
          <span
            ref={caret}
            aria-hidden
            className="ml-0.5 inline-block h-[1.1em] w-px translate-y-[0.2em] animate-pulse bg-foreground motion-reduce:animate-none"
          />
        </p>
        <div className="mt-fib-lg flex flex-wrap items-center gap-fib-md">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full px-6 text-base active:scale-[0.97]"
          >
            <Link href={inquiryHref(message) as never}>Anfrage vorbereiten</Link>
          </Button>
          {touched ? (
            <Button type="button" variant="ghost" onClick={reset}>
              Auswahl zurücksetzen
            </Button>
          ) : null}
        </div>
        <p className="mt-fib-md text-sm text-pretty text-muted-foreground">
          Sie können den Text im Kontaktformular noch ändern und ergänzen.
        </p>
      </div>
    </div>
  );
}

function Question({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
        {legend}
      </legend>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      <div className="mt-fib-md flex flex-wrap gap-fib-xs">{children}</div>
    </fieldset>
  );
}

function Chip({
  type,
  name,
  label,
  checked,
  onChange,
}: {
  type: "checkbox" | "radio";
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="group/chip relative inline-flex cursor-pointer items-center gap-2 rounded-full border px-5 py-3 text-base transition-[background-color,color,border-color,scale] duration-150 ease-(--ease-out) select-none hover:border-foreground/40 active:scale-[0.97] has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <CheckIcon
        aria-hidden
        className="pointer-events-none -ml-1 size-4 scale-75 opacity-0 transition-[opacity,scale] duration-150 ease-(--ease-out) group-has-checked/chip:scale-100 group-has-checked/chip:opacity-100"
      />
      {label}
    </label>
  );
}
