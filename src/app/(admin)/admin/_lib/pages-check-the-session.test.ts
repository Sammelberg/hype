// @vitest-environment node
// Layout and page render in parallel, so a check in the layout alone lets page code run for a
// visitor without a session. Every admin page checks the session itself; this keeps it so.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const admin = path.resolve(__dirname, "..");
const signedInGroups = ["(app)", "(druck)"];

const pages = signedInGroups.flatMap((group) =>
  readdirSync(path.join(admin, group), { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith("page.tsx"))
    .map((file) => path.join(group, file)),
);

describe("admin pages", () => {
  it("are found", () => {
    expect(pages.length).toBeGreaterThan(20);
  });

  it.each(pages)("%s checks the session itself", (file) => {
    const source = readFileSync(path.join(admin, file), "utf8");
    expect(source).toMatch(/await require(User|Role)\(/);
  });
});
