// Builds Lexical documents from short block descriptions — for the seed, tests and defaults.
import type { LexicalDocument, LexicalNode } from "./schema";

export type Block =
  | { kind: "p" | "h2"; text: string }
  /** One paragraph with line breaks (an address). */
  | { kind: "lines"; lines: string[] }
  | { kind: "ul"; items: string[] }
  /** One paragraph with links inside (a part with `href` becomes a link). */
  | { kind: "rich"; parts: (string | { text: string; href: string })[] };

const text = (value: string): LexicalNode => ({
  type: "text",
  text: value,
  format: 0,
  detail: 0,
  mode: "normal",
  style: "",
  version: 1,
});
const common = { format: "", indent: 0, version: 1, direction: "ltr" as const };

export function lexical(blocks: Block[]): LexicalDocument {
  return {
    root: {
      type: "root",
      ...common,
      children: blocks.map((b): LexicalNode => {
        if (b.kind === "h2")
          return { type: "heading", tag: "h2", ...common, children: [text(b.text)] };
        if (b.kind === "lines")
          return {
            type: "paragraph",
            textFormat: 0,
            ...common,
            children: b.lines.flatMap((line, i) =>
              i === 0 ? [text(line)] : [{ type: "linebreak", version: 1 }, text(line)],
            ),
          };
        if (b.kind === "ul")
          return {
            type: "list",
            listType: "bullet",
            tag: "ul",
            start: 1,
            ...common,
            children: b.items.map((item, i) => ({
              type: "listitem",
              value: i + 1,
              ...common,
              children: [text(item)],
            })),
          };
        if (b.kind === "rich")
          return {
            type: "paragraph",
            textFormat: 0,
            ...common,
            children: b.parts.map((part) =>
              typeof part === "string"
                ? text(part)
                : {
                    type: "link",
                    fields: { linkType: "custom", url: part.href, newTab: false },
                    ...common,
                    version: 3,
                    children: [text(part.text)],
                  },
            ),
          };
        return { type: "paragraph", textFormat: 0, ...common, children: [text(b.text)] };
      }),
    },
  };
}
