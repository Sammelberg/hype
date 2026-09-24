// Plain text of the first non-empty paragraph in Lexical rich text (for teasers outside the page).
type Node = { type?: string; text?: string; children?: Node[] };

function textOf(node: Node): string {
  return node.text ?? node.children?.map(textOf).join("") ?? "";
}

export function firstParagraph(
  content: { root?: { children?: unknown[] } } | null | undefined,
): string | null {
  for (const node of (content?.root?.children ?? []) as Node[]) {
    if (node.type !== "paragraph") continue;
    const text = textOf(node).trim();
    if (text) return text;
  }
  return null;
}
