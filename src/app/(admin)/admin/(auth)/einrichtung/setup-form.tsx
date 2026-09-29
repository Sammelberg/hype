"use client";

import { useActionState, useEffect, useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { MIN_PASSWORD_LENGTH } from "@/cms/auth/password-rules";
import { type AuthState, setup } from "../../_actions/auth";
import { PasswordField } from "../../_components/password-field";

export function SetupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(setup, {});
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error && !state.field) alertRef.current?.focus();
  }, [state]);
  const fieldError = (field: string) => (state.field === field ? state.error : undefined);

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.error && !state.field ? (
        <Alert variant="destructive" ref={alertRef} tabIndex={-1} role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="setup-name">Name</FieldLabel>
          <Input
            id="setup-name"
            name="name"
            autoComplete="name"
            defaultValue={state.values?.name ?? ""}
          />
        </Field>
        <Field data-invalid={fieldError("email") ? true : undefined}>
          <FieldLabel htmlFor="setup-email">E-Mail-Adresse</FieldLabel>
          <Input
            id="setup-email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            aria-invalid={fieldError("email") ? true : undefined}
            defaultValue={state.values?.email ?? ""}
          />
          {fieldError("email") ? (
            <p className="text-sm text-destructive">{fieldError("email")}</p>
          ) : null}
        </Field>
        <PasswordField
          id="setup-password"
          name="password"
          label="Passwort"
          autoComplete="new-password"
          description={`Mindestens ${MIN_PASSWORD_LENGTH} Zeichen. Ein Satz, den nur Sie kennen, ist leichter zu merken als Sonderzeichen.`}
          error={fieldError("password")}
        />
        <PasswordField
          id="setup-confirm"
          name="confirm"
          label="Passwort wiederholen"
          autoComplete="new-password"
          error={fieldError("confirm")}
        />
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Zugang anlegen
      </Button>
    </form>
  );
}
