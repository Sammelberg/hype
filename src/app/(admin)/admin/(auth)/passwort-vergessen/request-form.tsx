"use client";

import { useActionState, useEffect, useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { type AuthState, requestPasswordReset } from "../../_actions/auth";

export function RequestForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error && !state.field) alertRef.current?.focus();
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.error && !state.field ? (
        <Alert variant="destructive" ref={alertRef} tabIndex={-1} role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Field data-invalid={state.field === "email" || undefined}>
        <FieldLabel htmlFor="reset-email">E-Mail-Adresse</FieldLabel>
        <Input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          autoFocus
          defaultValue={state.values?.email ?? ""}
          aria-invalid={state.field === "email" || undefined}
        />
        {state.field === "email" ? <FieldError>{state.error}</FieldError> : null}
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Link senden
      </Button>
    </form>
  );
}
