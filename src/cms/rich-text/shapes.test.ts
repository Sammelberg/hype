import { describe, expect, it } from "vitest";

import type { LexicalDocument } from "./schema";
import type { TextPart } from "./parts";
import { listOnly, plainParagraphs, shapeParts, shortList, stepTitle } from "./shapes";

const text = (value: string) => ({ type: "text", text: value, format: 0 });
const link = (value: string) => ({ type: "link", fields: { url: "/x" }, children: [text(value)] });
const p = (...children: unknown[]) => ({
  type: "paragraph",
  children: children.map((c) => (typeof c === "string" ? text(c) : c)),
});
const ul = (...items: string[]) => ({
  type: "list",
  listType: "bullet",
  children: items.map((item) => ({ type: "listitem", children: [text(item)] })),
});
const doc = (...children: unknown[]) => ({ root: { type: "root", children } }) as LexicalDocument;
const part = (title: string, ...children: unknown[]): TextPart => ({
  title,
  body: doc(...children),
});

describe("plainParagraphs", () => {
  it("returns the paragraphs of a text without links", () => {
    expect(plainParagraphs(doc(p("Eins"), p("Zwei")))).toEqual(["Eins", "Zwei"]);
  });
  it("refuses links, lists and empty documents", () => {
    expect(plainParagraphs(doc(p("Siehe ", link("hier"))))).toBeNull();
    expect(plainParagraphs(doc(ul("a", "b")))).toBeNull();
    expect(plainParagraphs(doc())).toBeNull();
    expect(plainParagraphs(null)).toBeNull();
  });
});

describe("listOnly", () => {
  it("returns the items when the body is one list", () => {
    expect(listOnly(doc(ul("a", "b", "c")))).toEqual(["a", "b", "c"]);
  });
  it("refuses a list with text around it or a single item", () => {
    expect(listOnly(doc(p("x"), ul("a", "b")))).toBeNull();
    expect(listOnly(doc(ul("a")))).toBeNull();
  });
});

describe("shortList", () => {
  it("finds one list of short items and the text around it", () => {
    const shape = shortList(
      doc(p("Vorher"), ul("Kunden", "Kalkulation", "Rechnungen"), p("Nachher")),
    );
    expect(shape?.items).toEqual(["Kunden", "Kalkulation", "Rechnungen"]);
    expect(shape?.before?.root.children).toHaveLength(1);
    expect(shape?.after?.root.children).toHaveLength(1);
  });
  it("refuses long items, too few or too many, and two lists", () => {
    expect(shortList(doc(ul("a".repeat(60), "b", "c")))).toBeNull();
    expect(shortList(doc(ul("a", "b")))).toBeNull();
    expect(shortList(doc(ul(..."abcdefghi".split(""))))).toBeNull();
    expect(shortList(doc(ul("a", "b", "c"), ul("d", "e", "f")))).toBeNull();
  });
});

describe("stepTitle", () => {
  it("reads a numbered heading", () => {
    expect(stepTitle("1. Verstehen")).toEqual({ number: 1, title: "Verstehen" });
    expect(stepTitle("12) Betreiben")).toEqual({ number: 12, title: "Betreiben" });
  });
  it("leaves other headings alone", () => {
    expect(stepTitle("Ihr Code gehört Ihnen")).toBeNull();
    expect(stepTitle("2026 im Rückblick")).toBeNull();
  });
});

describe("shapeParts", () => {
  it("gathers numbered parts into one way and three short parts into cards", () => {
    const blocks = shapeParts([
      part("1. Verstehen", p("a")),
      part("2. Entwerfen", p("b")),
      part("Ihr Code", p("c")),
      part("Feste Ansprechpartner", p("d")),
      part("Daten in Europa", p("e")),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["steps", "cards"]);
    const [steps, cards] = blocks;
    expect(steps?.kind === "steps" && steps.steps.map((s) => s.title)).toEqual([
      "Verstehen",
      "Entwerfen",
    ]);
    expect(cards?.kind === "cards" && cards.parts).toHaveLength(3);
  });

  it("keeps a single numbered part and two short parts as plain parts", () => {
    const blocks = shapeParts([part("1. Allein", p("a")), part("A", p("b")), part("B", p("c"))]);
    expect(blocks.map((b) => b.kind)).toEqual(["part", "part", "part"]);
  });

  it("lays out a list-only part as promises and a short list as modules", () => {
    const blocks = shapeParts([
      part("Zusagen", ul("Eins ist lang genug", "Zwei")),
      part("Produkt", p("x"), ul("Kunden", "Kalkulation", "Rechnungen")),
      part("Text", p("Siehe ", link("hier"))),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["promises", "modules", "part"]);
  });
});
