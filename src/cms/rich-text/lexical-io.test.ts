import { describe, expect, it } from "vitest";

import { lexical } from "./build";
import { fromEditorDocument, toEditorDocument } from "./lexical-io";

const stored = lexical([
  {
    kind: "rich",
    parts: ["Siehe ", { text: "Arbeitsweise", href: "/ueber-uns/arbeitsweise" }, "."],
  },
]);

describe("lexical-io", () => {
  it("gives the editor a plain url and takes Payload's fields back", () => {
    const editor = toEditorDocument(stored);
    const link = editor.root.children[0]!.children![1]!;
    expect(link.type).toBe("link");
    expect(link).toMatchObject({ url: "/ueber-uns/arbeitsweise", target: null });
    expect(link.fields).toBeUndefined();

    const back = fromEditorDocument(editor);
    expect(back.root.children[0]!.children![1]).toMatchObject({
      type: "link",
      fields: { linkType: "custom", url: "/ueber-uns/arbeitsweise", newTab: false },
    });
    expect((back.root.children[0]!.children![1] as { url?: string }).url).toBeUndefined();
  });

  it("keeps a new-tab link as newTab", () => {
    const editor = toEditorDocument(stored);
    editor.root.children[0]!.children![1] = {
      ...editor.root.children[0]!.children![1]!,
      target: "_blank",
    } as never;
    expect(fromEditorDocument(editor).root.children[0]!.children![1]!.fields).toMatchObject({
      newTab: true,
    });
  });

  it("leaves text, headings and lists alone", () => {
    const doc = lexical([
      { kind: "h2", text: "Titel" },
      { kind: "ul", items: ["a", "b"] },
    ]);
    expect(fromEditorDocument(toEditorDocument(doc))).toEqual(doc);
  });
});
