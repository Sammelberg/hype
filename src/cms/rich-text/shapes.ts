// The shapes a content page's parts take on the site, read from the text itself, so a page edited
// in /admin keeps its design without a field for it: numbered parts („1. Verstehen“) become one way
// of steps, three or more short parts in a row become cards, a part that is only a list becomes
// promises, a part with one list of short items becomes modules. Everything else stays a part.
// Pure (no React), so the site and tests share it.
import type { TextPart } from "./parts";
import type { LexicalDocument, LexicalNode } from "./schema";
import { textOf } from "./text";

/** Longest item of a list that reads as a set of modules. */
const SHORT_ITEM = 40;
/** Longest text of a part that still fits on a card. */
const SHORT_PART = 420;

const isPlainInline = (node: LexicalNode) =>
  (node.type === "text" && !node.format) || node.type === "linebreak";

/** The paragraphs of a text that holds nothing but plain paragraphs, or null. */
export function plainParagraphs(doc: LexicalDocument | null | undefined): string[] | null {
  const nodes = doc?.root.children ?? [];
  if (nodes.length === 0) return null;
  const plain = nodes.every(
    (n) => n.type === "paragraph" && (n.children ?? []).every(isPlainInline),
  );
  if (!plain) return null;
  const texts = nodes.map((n) => textOf(n).trim()).filter(Boolean);
  return texts.length ? texts : null;
}

const itemsOf = (list: LexicalNode) =>
  (list.children ?? []).map((item) => textOf(item).trim()).filter(Boolean);

/** The items when the text is one list of at least two items and nothing else, or null. */
export function listOnly(doc: LexicalDocument | null | undefined): string[] | null {
  const nodes = doc?.root.children ?? [];
  if (nodes.length !== 1 || nodes[0]!.type !== "list") return null;
  const items = itemsOf(nodes[0]!);
  return items.length >= 2 ? items : null;
}

/** One list of three to eight short items, with the text before and after it. */
export function shortList(doc: LexicalDocument | null | undefined): {
  before: LexicalDocument | null;
  items: string[];
  after: LexicalDocument | null;
} | null {
  if (!doc) return null;
  const nodes = doc.root.children;
  const lists = nodes.filter((n) => n.type === "list");
  if (lists.length !== 1) return null;
  const items = itemsOf(lists[0]!);
  if (items.length < 3 || items.length > 8 || items.some((i) => i.length > SHORT_ITEM)) return null;
  const at = nodes.indexOf(lists[0]!);
  const slice = (from: number, to: number) =>
    from < to ? { root: { ...doc.root, children: nodes.slice(from, to) } } : null;
  return { before: slice(0, at), items, after: slice(at + 1, nodes.length) };
}

/** „1. Verstehen“ → its number and title; null for a heading without a leading number. */
export function stepTitle(title: string): { number: number; title: string } | null {
  const match = /^(\d{1,2})[.)]\s+(.+)$/.exec(title.trim());
  return match ? { number: Number(match[1]), title: match[2]! } : null;
}

const isShort = (part: TextPart) => {
  const texts = plainParagraphs(part.body);
  return texts?.length === 1 && texts[0]!.length <= SHORT_PART;
};

export type Step = { number: number; title: string; body: LexicalDocument };

export type Block =
  | { kind: "steps"; steps: Step[] }
  | { kind: "cards"; parts: TextPart[] }
  | { kind: "promises"; part: TextPart; items: string[] }
  | {
      kind: "modules";
      part: TextPart;
      before: LexicalDocument | null;
      items: string[];
      after: LexicalDocument | null;
    }
  | { kind: "part"; part: TextPart };

/** The parts of a page, grouped and shaped for the site. */
export function shapeParts(parts: readonly TextPart[]): Block[] {
  const blocks: Block[] = [];
  for (let i = 0; i < parts.length;) {
    // A run of numbered parts (at least two) is one way.
    let end = i;
    while (end < parts.length && stepTitle(parts[end]!.title)) end++;
    if (end - i >= 2) {
      blocks.push({
        kind: "steps",
        steps: parts.slice(i, end).map((part) => ({ ...stepTitle(part.title)!, body: part.body })),
      });
      i = end;
      continue;
    }
    // A run of short parts (at least three) becomes cards.
    end = i;
    while (end < parts.length && !stepTitle(parts[end]!.title) && isShort(parts[end]!)) end++;
    if (end - i >= 3) {
      blocks.push({ kind: "cards", parts: parts.slice(i, end) });
      i = end;
      continue;
    }
    const part = parts[i]!;
    const items = listOnly(part.body);
    const modules = items ? null : shortList(part.body);
    if (items) blocks.push({ kind: "promises", part, items });
    else if (modules) blocks.push({ kind: "modules", part, ...modules });
    else blocks.push({ kind: "part", part });
    i++;
  }
  return blocks;
}
