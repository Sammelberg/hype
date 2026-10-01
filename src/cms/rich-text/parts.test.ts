import { describe, expect, it } from "vitest";

import type { LexicalDocument } from "./schema";
import { partsOf } from "./parts";

const text = (value: string) => ({ type: "text", text: value });
const p = (value: string) => ({ type: "paragraph", children: [text(value)] });
const h = (tag: string, value: string) => ({ type: "heading", tag, children: [text(value)] });
const doc = (...children: unknown[]) => ({ root: { type: "root", children } }) as LexicalDocument;
const texts = (d: LexicalDocument | null) =>
  d?.root.children.map((n) => n.children?.[0]?.text) ?? null;

describe("partsOf", () => {
  it("splits at every h2: the text before is the intro, each h2 titles its part", () => {
    const { intro, parts } = partsOf(
      doc(p("Vorweg"), h("h2", "Eins"), p("a"), p("b"), h("h2", "Zwei"), p("c")),
    );
    expect(texts(intro)).toEqual(["Vorweg"]);
    expect(parts.map((part) => part.title)).toEqual(["Eins", "Zwei"]);
    expect(parts.map((part) => texts(part.body))).toEqual([["a", "b"], ["c"]]);
  });

  it("keeps h3 and h4 inside their part", () => {
    const { parts } = partsOf(doc(h("h2", "Eins"), h("h3", "Unterpunkt"), p("a")));
    expect(texts(parts[0]!.body)).toEqual(["Unterpunkt", "a"]);
  });

  it("has no intro when the text opens with an h2, and no parts without one", () => {
    expect(partsOf(doc(h("h2", "Eins"), p("a"))).intro).toBeNull();
    const plain = partsOf(doc(p("a"), p("b")));
    expect(texts(plain.intro)).toEqual(["a", "b"]);
    expect(plain.parts).toEqual([]);
  });

  it("drops empty paragraphs at the edges and h2s without text", () => {
    const { intro, parts } = partsOf(
      doc({ type: "paragraph", children: [] }, h("h2", "  "), h("h2", "Eins"), p("a")),
    );
    expect(intro).toBeNull();
    expect(parts.map((part) => part.title)).toEqual(["Eins"]);
  });

  it("returns nothing for an empty document", () => {
    expect(partsOf(null)).toEqual({ intro: null, parts: [] });
  });
});
