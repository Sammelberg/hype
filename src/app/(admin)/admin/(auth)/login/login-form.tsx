"use client";

import { useActionState, useEffect, useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { type AuthState, login } from "../../_actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.error) alertRef.current?.focus();
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-6">
      {next ? <input type="hidden" name="weiter" value={next} /> : null}
      {state.error ? (
        <Alert variant="destructive" ref={alertRef} tabIndex={-1} role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="login-email">E-Mail-Adresse</FieldLabel>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            autoFocus
            defaultValue={state.values?.email ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="login-password">Passwort</FieldLabel>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Anmelden
      </Button>
    </form>
  );
}
