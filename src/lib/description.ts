// A page description for search results, which show about 160 characters: whole sentences while
// they fit, else cut at a word with an ellipsis. Only for fallbacks (lead, first paragraph); a
// description written in the CMS is used as written.
const MAX = 160;

export function clampDescription(text: string | null | undefined): string | undefined {
  const clean = text?.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  if (clean.length <= MAX) return clean;
  const head = clean.slice(0, MAX);
  // The last sentence end that leaves at least half the room used.
  const sentence = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  if (sentence >= MAX / 2) return head.slice(0, sentence + 1);
  if (/[.!?]$/.test(head) && clean[MAX] === " ") return head;
  const word = head.slice(0, MAX - 1).lastIndexOf(" ");
  return `${head.slice(0, word > 0 ? word : MAX - 1).replace(/[\s,;:–-]+$/, "")}…`;
}
