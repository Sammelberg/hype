// Plain text out of Lexical rich text: the first paragraph for teasers, everything for search.
import type { LexicalDocument, LexicalNode } from "./schema";

export function textOf(node: LexicalNode): string {
  if (node.type === "linebreak") return " ";
  return node.text ?? node.children?.map(textOf).join("") ?? "";
}

export function firstParagraph(content: LexicalDocument | null | undefined): string | null {
  for (const node of content?.root.children ?? []) {
    if (node.type !== "paragraph") continue;
    const text = textOf(node).trim();
    if (text) return text;
  }
  return null;
}

// One line per block; list items become lines of their own.
export function plainText(content: LexicalDocument | null | undefined): string {
  return (content?.root.children ?? [])
    .flatMap((node) => (node.type === "list" ? (node.children ?? []).map(textOf) : [textOf(node)]))
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}
