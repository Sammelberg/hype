// Renders a Lexical document as React: paragraphs, h2–h4, lists, links, quotes, rules, line
// breaks and text with its format bits. Links to our own paths use next/link. Unknown node types
// render nothing (and are logged once in development), so old content never breaks a page.
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { docPath } from "../paths";
import { type LexicalDocument, type LexicalNode, TEXT_FORMAT } from "./schema";

const warned = new Set<string>();

function linkHref(fields: Record<string, unknown> | undefined): string {
  if (!fields) return "#";
  if (fields.linkType === "internal") {
    const doc = fields.doc as { relationTo?: string; value?: unknown } | undefined;
    if (doc?.value && typeof doc.value === "object") {
      return docPath(doc.relationTo, doc.value as Record<string, unknown>) ?? "#";
    }
    return "#";
  }
  return typeof fields.url === "string" && fields.url ? fields.url : "#";
}

function renderText(node: LexicalNode, key: number): ReactNode {
  let out: ReactNode = node.text ?? "";
  const format = typeof node.format === "number" ? node.format : 0;
  if (format & TEXT_FORMAT.code) out = <code>{out}</code>;
  if (format & TEXT_FORMAT.bold) out = <strong>{out}</strong>;
  if (format & TEXT_FORMAT.italic) out = <em>{out}</em>;
  if (format & TEXT_FORMAT.underline) out = <u>{out}</u>;
  if (format & TEXT_FORMAT.strikethrough) out = <s>{out}</s>;
  return <Fragment key={key}>{out}</Fragment>;
}

function renderChildren(node: LexicalNode): ReactNode {
  return (node.children ?? []).map((child, i) => renderNode(child, i));
}

function renderNode(node: LexicalNode, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);
    case "linebreak":
      return <br key={key} />;
    case "paragraph":
      return <p key={key}>{renderChildren(node)}</p>;
    case "heading": {
      const Tag = (["h2", "h3", "h4"].includes(String(node.tag)) ? node.tag : "h2") as
        "h2" | "h3" | "h4";
      return <Tag key={key}>{renderChildren(node)}</Tag>;
    }
    case "list": {
      const Tag = node.listType === "number" ? "ol" : "ul";
      return <Tag key={key}>{renderChildren(node)}</Tag>;
    }
    case "listitem":
      return <li key={key}>{renderChildren(node)}</li>;
    case "quote":
      return <blockquote key={key}>{renderChildren(node)}</blockquote>;
    case "horizontalrule":
      return <hr key={key} />;
    case "link":
    case "autolink": {
      const href = linkHref(node.fields);
      const newTab = node.fields?.newTab === true;
      const external = /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
      if (!external && href.startsWith("/")) {
        return (
          <Link
            key={key}
            href={href as never}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
          >
            {renderChildren(node)}
          </Link>
        );
      }
      return (
        <a
          key={key}
          href={href}
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener noreferrer" : undefined}
        >
          {renderChildren(node)}
        </a>
      );
    }
    default:
      if (process.env.NODE_ENV !== "production" && !warned.has(node.type)) {
        warned.add(node.type);
        console.warn(`Rich text: unbekannter Knotentyp „${node.type}“ wird nicht dargestellt.`);
      }
      return null;
  }
}

export function renderLexical(doc: LexicalDocument | null | undefined): ReactNode {
  if (!doc) return null;
  return doc.root.children.map((node, i) => renderNode(node, i));
}
