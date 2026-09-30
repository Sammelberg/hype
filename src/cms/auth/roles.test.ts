import { describe, expect, it } from "vitest";

import { mayOpen } from "./roles";

describe("mayOpen", () => {
  it("lets an admin open everything", () => {
    expect(mayOpen("admin", "/admin/rechnungen/3")).toBe(true);
    expect(mayOpen("admin", "/admin/benutzer")).toBe(true);
  });

  it("keeps the editors to the site's content", () => {
    for (const href of ["/admin", "/admin/seiten/4", "/admin/medien", "/admin/anfragen/2"])
      expect(mayOpen("redakteur", href)).toBe(true);
    for (const href of ["/admin/kunden", "/admin/rechnungen/3", "/admin/benutzer", "/admin/firma"])
      expect(mayOpen("redakteur", href)).toBe(false);
  });

  it("matches whole segments only", () => {
    expect(mayOpen("redakteur", "/admin/kundenstimmen")).toBe(true);
  });
});
