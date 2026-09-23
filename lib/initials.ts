// Monogram for placeholder icons: first and last initial ("Anna Maria Beispiel" → "AB").
export function initials(name: string, fallback = "P") {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase());
  if (letters.length === 0) return fallback;
  return letters.length > 1 ? letters[0]! + letters.at(-1)! : letters[0]!;
}
