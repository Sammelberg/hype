import { z } from "zod";

// Lexical's serialised editor state, as Payload stored it and as our editor writes it. The site
// uses eight node types (rich-text/render.tsx); unknown nodes pass validation and render nothing,
// so content from a newer editor never fails to save.
const baseNode = z.looseObject({
  type: z.string(),
  version: z.number().optional(),
});

export type LexicalNode = z.infer<typeof baseNode> & {
  text?: string;
  format?: number | string;
  tag?: string;
  listType?: string;
  fields?: Record<string, unknown>;
  children?: LexicalNode[];
};

const node: z.ZodType<LexicalNode, LexicalNode> = baseNode.extend({
  children: z.lazy(() => z.array(node)).optional(),
});

export const LexicalDocumentSchema = z.object({
  root: z.looseObject({
    type: z.literal("root"),
    children: z.array(node),
  }),
});

export type LexicalDocument = z.infer<typeof LexicalDocumentSchema>;

// Text format bits, as Lexical stores them.
export const TEXT_FORMAT = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
  code: 16,
} as const;

// Lexical refuses a root without children, so the empty document holds one empty paragraph.
export const emptyDocument = (): LexicalDocument => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: null,
        textFormat: 0,
        children: [],
      },
    ],
  },
});

// True when the document holds no text at all (an untouched editor still saves one empty paragraph).
export function isEmptyDocument(doc: LexicalDocument | null | undefined) {
  if (!doc) return true;
  const hasText = (n: LexicalNode): boolean =>
    Boolean(n.text?.trim()) || (n.children ?? []).some(hasText);
  return !doc.root.children.some(hasText);
}
