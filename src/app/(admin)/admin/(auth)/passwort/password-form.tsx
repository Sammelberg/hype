"use client";

import { useActionState, useEffect, useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { MIN_PASSWORD_LENGTH } from "@/cms/auth/password-rules";
import { type AuthState, changePassword } from "../../_actions/auth";
import { PasswordField } from "../../_components/password-field";

export function PasswordForm({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(changePassword, {});
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
        {forced ? null : (
          <PasswordField
            id="pw-current"
            name="current"
            label="Aktuelles Passwort"
            autoComplete="current-password"
            error={fieldError("current")}
          />
        )}
        <PasswordField
          id="pw-new"
          name="password"
          label="Neues Passwort"
          autoComplete="new-password"
          description={`Mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`}
          error={fieldError("password")}
        />
        <PasswordField
          id="pw-confirm"
          name="confirm"
          label="Neues Passwort wiederholen"
          autoComplete="new-password"
          error={fieldError("confirm")}
        />
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Passwort speichern
      </Button>
    </form>
  );
}
