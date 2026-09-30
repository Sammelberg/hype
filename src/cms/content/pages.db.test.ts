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

  it("refuses sections on a content page and keeps a fixed page's slug", async () => {
    await expect(
      createPage(input("test-abschnitte", { sections: { kind: "projekte", empty: null } })),
    ).rejects.toThrow(/keine festen Abschnitte/);
    const kontakt = await getPageByPath("/kontakt", true);
    if (!kontakt) return; // a database without the page (before the seed)
    const found = await getPage(kontakt.id);
    await expect(
      saveDraft(kontakt.id, { ...found!.editing, slug: "test-kontakt-anders" }),
    ).rejects.toThrow(PageError);
  });

  it("a draft without sections (an old version) keeps the live sections", async () => {
    const home = await getPageByPath("/", true);
    // Never touches a home page someone is editing: its draft would be lost below.
    if (!home?.sections || home.hasDraft) return;
    const found = await getPage(home.id);
    const withoutSections: Partial<PageInput> = { ...found!.editing };
    delete withoutSections.sections;
    await saveDraft(home.id, withoutSections as PageInput);
    try {
      expect((await getPage(home.id))!.page.sections).toEqual(home.sections);
    } finally {
      await db.update(pages).set({ draft: null }).where(like(pages.slug, "startseite"));
    }
  });

  it("a redirect is found case-insensitively and points at the page's current path", async () => {
    const id = await createPage(input("test-ziel"), { publish: true });
    await createRedirect({
      from: "/Test-Alt/",
      type: 308,
      toPageId: id,
      toProjektId: null,
      toUrl: null,
    });
    expect(await findRedirect("/test-alt")).toEqual({ destination: "/test-ziel", permanent: true });
  });

  it("refuses to withdraw a page while pages below it are published", async () => {
    const parent = await createPage(input("test-rueckzug"), { publish: true });
    await createPage(input("test-rueckzug-kind", { parentId: parent }), { publish: true });
    await expect(unpublishPage(parent)).rejects.toThrow(/test-rueckzug-kind/);
    expect((await getPageByPath("/test-rueckzug"))?.status).toBe("published");
  });

  it("a new address leaves a redirect from the old one, for the page and every page below", async () => {
    const parent = await createPage(input("test-umzug"), { publish: true });
    await createPage(input("test-umzug-kind", { parentId: parent }), { publish: true });
    await saveDraft(parent, input("test-umzug-neu"));
    await publishPage(parent, null);
    expect(await findRedirect("/test-umzug")).toEqual({
      destination: "/test-umzug-neu",
      permanent: true,
    });
    expect(await findRedirect("/test-umzug/test-umzug-kind")).toEqual({
      destination: "/test-umzug-neu/test-umzug-kind",
      permanent: true,
    });

    // Back to the old address: the page is there again, its redirect goes, the other one stays.
    await saveDraft(parent, input("test-umzug"));
    await publishPage(parent, null);
    expect(await findRedirect("/test-umzug")).toBeNull();
    expect(await findRedirect("/test-umzug-neu")).toEqual({
      destination: "/test-umzug",
      permanent: true,
    });
  });

  it("a page that has never been public leaves no redirect behind", async () => {
    const id = await createPage(input("test-entwurf-alt"));
    await saveDraft(id, input("test-entwurf-neu"));
    await publishPage(id, null);
    expect(await findRedirect("/test-entwurf-alt")).toBeNull();
  });

  it("refuses to delete a page redirects point at, and names them", async () => {
    const id = await createPage(input("test-redirect-ziel"), { publish: true });
    await createRedirect({
      from: "/test-redirect-quelle",
      type: 308,
      toPageId: id,
      toProjektId: null,
      toUrl: null,
    });
    await expect(deletePage(id)).rejects.toThrow(/test-redirect-quelle/);
  });

  it("refuses a redirect onto itself, into a loop, or to an address that is not a web page", async () => {
    const redirect = (from: string, toUrl: string) =>
      createRedirect({ from, type: 308, toPageId: null, toProjektId: null, toUrl });
    await expect(redirect("/test-kreis", "/test-kreis")).rejects.toThrow(/sich selbst/);
    await redirect("/test-kreis-a", "/test-kreis-b");
    await expect(redirect("/test-kreis-b", "/test-kreis-a")).rejects.toThrow(/Kreis/);
    await expect(redirect("/test-schema", "javascript:alert(1)")).rejects.toThrow(/https/);
    await expect(redirect("/test-schema", "//evil.example")).rejects.toThrow(/https/);
    await redirect("/test-extern", "https://example.com/seite");
  });
});
