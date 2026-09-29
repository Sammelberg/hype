"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

// A password input with a show/hide button; never blocks paste.
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  description,
  error,
  required = true,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  description?: string;
  error?: string;
  required?: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-fehler` : description ? `${id}-hinweis` : undefined}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            aria-label={shown ? "Passwort verbergen" : "Passwort anzeigen"}
            aria-pressed={shown}
            onClick={() => setShown((s) => !s)}
          >
            {shown ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error ? (
        <FieldError id={`${id}-fehler`}>{error}</FieldError>
      ) : description ? (
        <FieldDescription id={`${id}-hinweis`}>{description}</FieldDescription>
      ) : null}
    </Field>
  );
}
