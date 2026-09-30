// Server-side validation for form-builder forms, with spam protection that needs no third party:
// a honeypot field (hidden from people, filled by bots) and a minimum fill time, measured from a
// start time the server signed when it rendered the form (form-token.ts).
import { verifyStart } from "./form-token";

export const HONEYPOT = "website";
export const STARTED_AT = "_started";
export const MIN_FILL_MS = 3000;
const MAX_LENGTH = 5000;
// Pragmatic check: something@domain.tld, no whitespace. The real proof is a reply.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactField = {
  blockType: string;
  name: string;
  label?: string | null;
  required?: boolean | null;
  options?: { label: string; value: string }[] | null;
};

export type SubmissionResult =
  | { status: "ok"; data: { field: string; value: string }[] }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "spam" };

const REQUIRED = "Bitte füllen Sie dieses Feld aus.";

function tooFast(formData: FormData, now: number, secret: string) {
  const startedAt = verifyStart(String(formData.get(STARTED_AT) ?? ""), now, secret);
  return startedAt === null || now - startedAt < MIN_FILL_MS;
}

export function validateSubmission(
  fields: ContactField[],
  formData: FormData,
  secret: string,
  now = Date.now(),
): SubmissionResult {
  // Honeypot first; the time check comes after validation, so a person who submits an empty form
  // quickly sees what is missing instead of a fake confirmation.
  if (String(formData.get(HONEYPOT) ?? "").trim()) return { status: "spam" };

  const errors: Record<string, string> = {};
  const data: { field: string; value: string }[] = [];

  for (const field of fields) {
    const raw = String(formData.get(field.name) ?? "").trim();

    if (field.blockType === "checkbox") {
      const checked = raw === "on";
      if (field.required && !checked) errors[field.name] = "Bitte bestätigen Sie dieses Feld.";
      if (checked) data.push({ field: field.name, value: "ja" });
      continue;
    }

    if (!raw) {
      if (field.required) errors[field.name] = REQUIRED;
      continue;
    }
    if (raw.length > MAX_LENGTH) {
      errors[field.name] = `Der Text ist zu lang (höchstens ${MAX_LENGTH} Zeichen).`;
    } else if (field.blockType === "email" && !EMAIL.test(raw)) {
      errors[field.name] = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    } else if (field.blockType === "number" && !Number.isFinite(Number(raw))) {
      errors[field.name] = "Bitte geben Sie eine Zahl ein.";
    } else if (
      field.blockType === "select" &&
      !field.options?.some((option) => option.value === raw)
    ) {
      errors[field.name] = "Bitte wählen Sie eine der Optionen.";
    } else {
      data.push({ field: field.name, value: raw });
    }
  }

  if (Object.keys(errors).length) return { status: "invalid", errors };
  return tooFast(formData, now, secret) ? { status: "spam" } : { status: "ok", data };
}
