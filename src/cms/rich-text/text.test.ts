import { describe, expect, it } from "vitest";

import type { LexicalDocument } from "./schema";
import { firstParagraph, plainText } from "./text";

const text = (value: string) => ({ type: "text", text: value });
const doc = (...children: unknown[]) => ({ root: { type: "root", children } }) as LexicalDocument;

describe("firstParagraph", () => {
  it("returns the text of the first paragraph", () => {
    const content = doc(
      { type: "heading", children: [text("Titel")] },
      { type: "paragraph", children: [text("Erster "), text("Absatz.")] },
      { type: "paragraph", children: [text("Zweiter.")] },
    );
    expect(firstParagraph(content)).toBe("Erster Absatz.");
  });

  it("includes text inside links and skips empty paragraphs", () => {
    const content = doc(
      { type: "paragraph", children: [] },
      { type: "paragraph", children: [text("Siehe "), { type: "link", children: [text("hier")] }] },
    );
    expect(firstParagraph(content)).toBe("Siehe hier");
  });

  it("keeps the words of lines apart (an address)", () => {
    const content = doc({
      type: "paragraph",
      children: [text("Merianhof 5"), { type: "linebreak" }, text("79104 Freiburg")],
    });
    expect(firstParagraph(content)).toBe("Merianhof 5 79104 Freiburg");
  });

  it("returns null without content", () => {
    expect(firstParagraph(null)).toBeNull();
    expect(firstParagraph(undefined)).toBeNull();
    expect(firstParagraph(doc())).toBeNull();
  });
});

describe("plainText", () => {
  it("joins every block's text, headings and list items included, one block per line", () => {
    const content = doc(
      { type: "heading", children: [text("Titel")] },
      {
        type: "paragraph",
        children: [text("Erster "), { type: "link", children: [text("Link")] }],
      },
      { type: "list", children: [{ type: "listitem", children: [text("ERP")] }] },
    );
    expect(plainText(content)).toBe("Titel\nErster Link\nERP");
  });

  it("returns an empty string without content", () => {
    expect(plainText(null)).toBe("");
    expect(plainText(doc())).toBe("");
  });
});
