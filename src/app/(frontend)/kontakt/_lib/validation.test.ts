import {
  HONEYPOT,
  MIN_FILL_MS,
  STARTED_AT,
  validateSubmission,
  type ContactField,
} from "./validation";

const fields: ContactField[] = [
  { blockType: "text", name: "name", label: "Name", required: true },
  { blockType: "email", name: "email", label: "E-Mail", required: true },
  { blockType: "textarea", name: "nachricht", label: "Nachricht", required: true },
  { blockType: "checkbox", name: "rueckruf", label: "Rückruf erwünscht" },
  {
    blockType: "select",
    name: "anliegen",
    label: "Anliegen",
    options: [
      { label: "Neues Projekt", value: "projekt" },
      { label: "Sonstiges", value: "sonstiges" },
    ],
  },
];

const now = 1_000_000;

function form(values: Record<string, string>, startedAt = now - MIN_FILL_MS - 1) {
  const data = new FormData();
  data.set(STARTED_AT, String(startedAt));
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const valid = { name: "Erika Beispiel", email: "erika@example.com", nachricht: "Hallo!" };

describe("validateSubmission", () => {
  it("accepts a complete submission and returns only configured fields", () => {
    const result = validateSubmission(fields, form({ ...valid, extra: "x", rueckruf: "on" }), now);
    expect(result).toEqual({
      status: "ok",
      data: [
        { field: "name", value: "Erika Beispiel" },
        { field: "email", value: "erika@example.com" },
        { field: "nachricht", value: "Hallo!" },
        { field: "rueckruf", value: "ja" },
      ],
    });
  });

  it("reports every missing required field in German", () => {
    const result = validateSubmission(fields, form({ name: "  " }), now);
    expect(result).toEqual({
      status: "invalid",
      errors: {
        name: "Bitte füllen Sie dieses Feld aus.",
        email: "Bitte füllen Sie dieses Feld aus.",
        nachricht: "Bitte füllen Sie dieses Feld aus.",
      },
    });
  });

  it("rejects a malformed email address", () => {
    const result = validateSubmission(fields, form({ ...valid, email: "erika@" }), now);
    expect(result).toMatchObject({
      status: "invalid",
      errors: { email: "Bitte geben Sie eine gültige E-Mail-Adresse ein." },
    });
  });

  it("rejects a select value that is not an option", () => {
    const result = validateSubmission(fields, form({ ...valid, anliegen: "hack" }), now);
    expect(result).toMatchObject({ status: "invalid", errors: { anliegen: expect.any(String) } });
  });

  it("rejects overly long input", () => {
    const result = validateSubmission(fields, form({ ...valid, nachricht: "a".repeat(5001) }), now);
    expect(result).toMatchObject({ status: "invalid", errors: { nachricht: expect.any(String) } });
  });

  it("flags a filled honeypot as spam", () => {
    const result = validateSubmission(fields, form({ ...valid, [HONEYPOT]: "https://spam" }), now);
    expect(result).toEqual({ status: "spam" });
  });

  it("flags submissions faster than a human as spam", () => {
    expect(validateSubmission(fields, form(valid, now - 500), now)).toEqual({ status: "spam" });
  });

  it("shows validation errors to a fast but incomplete submission instead of treating it as spam", () => {
    const result = validateSubmission(fields, form({ name: "" }, now - 500), now);
    expect(result).toMatchObject({ status: "invalid" });
  });

  it("flags a missing or forged start time as spam", () => {
    const data = form(valid);
    data.set(STARTED_AT, "abc");
    expect(validateSubmission(fields, data, now)).toEqual({ status: "spam" });
    expect(validateSubmission(fields, form(valid, now + 10_000), now)).toEqual({ status: "spam" });
  });
});
