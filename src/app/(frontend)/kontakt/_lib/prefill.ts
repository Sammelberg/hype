// Start values from the query string (e.g. /kontakt?nachricht=… from the homepage configurator).
// Only free-text fields are filled; email and choices always come from the visitor.
const PREFILLABLE = new Set(["text", "textarea"]);
const MAX_LENGTH = 2000;

export function prefillValues(
  search: string,
  fields: { name: string; blockType: string }[],
): Record<string, string> {
  const params = new URLSearchParams(search);
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = params.get(field.name);
    if (value && PREFILLABLE.has(field.blockType)) values[field.name] = value.slice(0, MAX_LENGTH);
  }
  return values;
}
