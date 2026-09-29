// @vitest-environment node
// Runs against DATABASE_URL (the local dev database in `.env`, the service database in CI) and
// cleans up after itself; every slug it creates starts with `test-`.
import { like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { pages, redirects } from "../db/schema";
import { emptyDocument } from "../rich-text/schema";
import {
  createPage,
  deletePage,
  getPage,
  getPageByPath,
  PageError,
  publishPage,
  saveDraft,
  unpublishPage,
} from "./pages";
import { createRedirect, findRedirect } from "./redirects";
import { searchSite } from "./search";
import type { PageInput } from "./types";

const input = (slug: string, extra: Partial<PageInput> = {}): PageInput => ({
  title: `Test ${slug}`,
  slug,
  parentId: null,
  lead: null,
  content: emptyDocument(),
  meta: {},
  ...extra,
});

describe.skipIf(!process.env.DATABASE_URL)("pages repository", () => {
  afterAll(async () => {
    await db.delete(redirects).where(like(redirects.from, "/test-%"));
    // Children first: the parent link is RESTRICT.
    for (let round = 0; round < 4; round++) {
      const rows = await db
        .select({ id: pages.id, path: pages.path })
        .from(pages)
        .where(like(pages.slug, "test-%"));
      for (const row of rows.sort((a, b) => b.path.length - a.path.length)) {
        await deletePage(row.id).catch(() => undefined);
      }
    }
  });

  it("a new page is not public until it is published, then reachable by its path", async () => {
    const id = await createPage(input("test-neu"));
    expect(await getPageByPath("/test-neu")).toBeNull();
    expect((await getPageByPath("/test-neu", true))?.title).toBe("Test test-neu");
    await publishPage(id, null);
    expect((await getPageByPath("/test-neu"))?.status).toBe("published");
  });

  it("a draft with a new slug previews under the new path and moves the children on publish", async () => {
    const parent = await createPage(input("test-eltern"), { publish: true });
    const child = await createPage(input("test-kind", { parentId: parent }), { publish: true });
    expect((await getPageByPath("/test-eltern/test-kind"))?.breadcrumbs.map((b) => b.url)).toEqual([
      "/test-eltern",
      "/test-eltern/test-kind",
    ]);

    await saveDraft(parent, input("test-eltern-neu"));
    expect((await getPageByPath("/test-eltern/test-kind"))?.title).toBe("Test test-kind");
    expect((await getPageByPath("/test-eltern-neu", true))?.hasDraft).toBe(true);

    const result = await publishPage(parent, null);
    expect(result.pathsBefore).toEqual(["/test-eltern", "/test-eltern/test-kind"]);
    expect(result.pathsAfter).toEqual(["/test-eltern-neu", "/test-eltern-neu/test-kind"]);
    expect((await getPageByPath("/test-eltern-neu/test-kind"))?.id).toBe(child);
    expect(await getPageByPath("/test-eltern/test-kind")).toBeNull();
  });

  it("refuses a slug another page already uses, also as a draft", async () => {
    const a = await createPage(input("test-a"));
    await createPage(input("test-b"));
    await expect(saveDraft(a, input("test-b"))).rejects.toBeInstanceOf(PageError);
    await expect(createPage(input("test-a"))).rejects.toThrow(/Pfad/);
  });

  it("refuses to move a page under one of its descendants", async () => {
    const top = await createPage(input("test-oben"));
    const below = await createPage(input("test-unten", { parentId: top }));
    await expect(saveDraft(top, input("test-oben", { parentId: below }))).rejects.toThrow(
      /unter sich/,
    );
  });

  it("unpublishing hides the page and keeps its content for the editor", async () => {
    const id = await createPage(input("test-versteckt"), { publish: true });
    await unpublishPage(id);
    expect(await getPageByPath("/test-versteckt")).toBeNull();
    expect((await getPage(id))?.editing.title).toBe("Test test-versteckt");
  });

  it("the search finds a published page by a word deep inside its text, not a draft", async () => {
    const doc = emptyDocument();
    doc.root.children.push({
      type: "paragraph",
      children: [
        { type: "text", text: "Ein Wort wie Holunderbluetensirup kommt sonst nirgends vor." },
      ],
    });
    const id = await createPage(input("test-suche", { content: doc }));
    expect(await searchSite("Holunderbluetensirup")).toEqual([]);
    await publishPage(id, null);
    expect((await searchSite("Holunderbluetensirup")).map((r) => r.url)).toEqual(["/test-suche"]);
  });

  it("a redirect is found case-insensitively and points at the page's current path", async () => {
    const id = await createPage(input("test-ziel"), { publish: true });
    await createRedirect({
      from: "/Test-Alt/",
      type: 301,
      toPageId: id,
      toProjektId: null,
      toUrl: null,
    });
    expect(await findRedirect("/test-alt")).toEqual({ destination: "/test-ziel", permanent: true });
  });
});
