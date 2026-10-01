// A text in parts, one per h2: the content pages lay each part out as a heading beside its text.
// Pure (no React), so the site and tests share it.
import type { LexicalDocument, LexicalNode } from "./schema";
import { textOf } from "./text";

export type TextPart = { title: string; body: LexicalDocument };

const isBlank = (node: LexicalNode) => node.type === "paragraph" && !textOf(node).trim();

function documentOf(root: LexicalDocument["root"], nodes: LexicalNode[]): LexicalDocument | null {
  let start = 0;
  let end = nodes.length;
  while (start < end && isBlank(nodes[start]!)) start++;
  while (end > start && isBlank(nodes[end - 1]!)) end--;
  return start < end ? { root: { ...root, children: nodes.slice(start, end) } } : null;
}

export function partsOf(content: LexicalDocument | null | undefined): {
  intro: LexicalDocument | null;
  parts: TextPart[];
} {
  if (!content) return { intro: null, parts: [] };
  const { root } = content;
  const introNodes: LexicalNode[] = [];
  const groups: { title: string; nodes: LexicalNode[] }[] = [];
  for (const node of root.children) {
    if (node.type === "heading" && (node.tag ?? "h2") === "h2") {
      const title = textOf(node).trim();
      // An h2 without text opens nothing; what follows stays with the part before.
      if (title) groups.push({ title, nodes: [] });
      continue;
    }
    (groups.at(-1)?.nodes ?? introNodes).push(node);
  }
  return {
    intro: documentOf(root, introNodes),
    parts: groups.map(({ title, nodes }) => ({
      title,
      body: documentOf(root, nodes) ?? { root: { ...root, children: [] } },
    })),
  };
}
