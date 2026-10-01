// The words of a search marked in a result's text: the text cut into pieces, each piece either a
// hit or not. Case and umlauts as typed do not matter; words shorter than two letters mark nothing.

export type Piece = { text: string; hit: boolean };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function highlight(text: string, query: string): Piece[] {
  const words = [...new Set(query.toLowerCase().split(/\s+/))].filter((w) => w.length >= 2);
  if (!text || words.length === 0) return [{ text, hit: false }];
  // Longest first, so „anwendung“ wins over „an“ where both match.
  const pattern = new RegExp(
    `(${words
      .sort((a, b) => b.length - a.length)
      .map(escape)
      .join("|")})`,
    "giu",
  );
  return text
    .split(pattern)
    .filter(Boolean)
    .map((piece) => ({ text: piece, hit: words.includes(piece.toLowerCase()) }));
}
