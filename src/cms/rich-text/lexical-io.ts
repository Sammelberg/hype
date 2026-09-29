// Between the stored document and the editor. Payload wrote links as
// `{ type: "link", fields: { linkType, url, newTab } }`; Lexical's own LinkNode reads and writes
// `{ url, target, rel }`. The site's renderer reads the stored shape, so the editor converts on
// the way in and out. Everything else passes through untouched.
import type { LexicalDocument, LexicalNode } from "./schema";

type LinkFields = { linkType?: string; url?: string; newTab?: boolean; doc?: unknown };

function mapNodes(nodes: LexicalNode[], fn: (node: LexicalNode) => LexicalNode): LexicalNode[] {
  return nodes.map((node) => {
    const mapped = fn(node);
    return mapped.children ? { ...mapped, children: mapNodes(mapped.children, fn) } : mapped;
  });
}

export function toEditorDocument(doc: LexicalDocument): LexicalDocument {
  return {
    root: {
      ...doc.root,
      children: mapNodes(doc.root.children, (node) => {
        if (node.type !== "link" || !node.fields) return node;
        const fields = node.fields as LinkFields;
        const { fields: _fields, ...rest } = node;
        void _fields;
        return {
          ...rest,
          version: 1,
          url: fields.url ?? "",
          target: fields.newTab ? "_blank" : null,
          rel: fields.newTab ? "noopener noreferrer" : null,
          title: null,
        };
      }),
    },
  };
}

export function fromEditorDocument(doc: LexicalDocument): LexicalDocument {
  return {
    root: {
      ...doc.root,
      children: mapNodes(doc.root.children, (node) => {
        if (node.type !== "link" && node.type !== "autolink") return node;
        if (node.fields) return node;
        const {
          url,
          target,
          rel: _rel,
          title: _title,
          ...rest
        } = node as LexicalNode & {
          url?: string;
          target?: string | null;
          rel?: string | null;
          title?: string | null;
        };
        void _rel;
        void _title;
        return {
          ...rest,
          type: "link",
          version: 3,
          fields: { linkType: "custom", url: url ?? "", newTab: target === "_blank" },
        };
      }),
    },
  };
}
