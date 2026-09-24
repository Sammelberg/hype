import { describe, expect, it } from "vitest";

import { prefillValues } from "./prefill";

describe("prefillValues", () => {
  it("takes query values for known text fields only", () => {
    const fields = [
      { name: "nachricht", blockType: "textarea" },
      { name: "email", blockType: "email" },
      { name: "name", blockType: "text" },
    ];
    expect(prefillValues("?nachricht=Hallo&name=Anna&email=x%40y.de&foo=1", fields)).toEqual({
      nachricht: "Hallo",
      name: "Anna",
    });
  });

  it("caps long values", () => {
    const long = "a".repeat(5000);
    const result = prefillValues(`?nachricht=${long}`, [
      { name: "nachricht", blockType: "textarea" },
    ]);
    expect(result.nachricht).toHaveLength(2000);
  });
});
