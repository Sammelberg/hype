import { describe, expect, it } from "vitest";

import { firstParagraph } from "./rich-text";

const text = (value: string) => ({ type: "text", text: value });
const doc = (...children: unknown[]) => ({ root: { type: "root", children } });

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

  it("returns null without content", () => {
    expect(firstParagraph(null)).toBeNull();
    expect(firstParagraph(undefined)).toBeNull();
    expect(firstParagraph(doc())).toBeNull();
  });
});
