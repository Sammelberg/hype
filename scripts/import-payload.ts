// `pnpm cms:import` — one-off copy of the content from Payload's tables (schema public) into the
// own CMS (schema cms): pages, projects, site settings, the contact form, redirects and the latest
// version of every document. Ids are kept, so nothing that points at a page changes.
// Refuses non-local databases unless CI=true or --force; cms.* content is replaced entirely.
import { Pool } from "pg";

import { plainText } from "../src/cms/rich-text/text";
import type { LexicalDocument } from "../src/cms/rich-text/schema";
import { pathsOf, type TreeNode } from "../src/cms/content/page-tree";
import {
  FormFieldSchema,
  HomeSectionsSchema,
  KontaktSectionsSchema,
  LeistungenSectionsSchema,
  ProjekteSectionsSchema,
  SiteSettingsSchema,
  type FormField,
  type SiteSettings,
} from "../src/cms/content/types";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL fehlt.");
{
  const host = new URL(url).hostname;
  const local = ["localhost", "127.0.0.1", "::1"].includes(host);
  if (!local && process.env.CI !== "true" && !process.argv.includes("--force")) {
    throw new Error(
      `Import abgebrochen: ${host} ist keine lokale Datenbank. Mit --force erzwingen.`,
    );
  }
}

const pool = new Pool({ connectionString: url, max: 1 });
const client = await pool.connect();

type Row = Record<string, unknown>;
const q = async <T extends Row = Row>(text: string, params: unknown[] = []) =>
  (await client.query(text, params)).rows as T[];
const one = async <T extends Row = Row>(text: string, params: unknown[] = []) =>
  (await q<T>(text, params))[0];

const str = (v: unknown) => (typeof v === "string" ? v : null);
const num = (v: unknown) =>
  typeof v === "number" ? v : v === null || v === undefined ? null : Number(v);
const json = (v: unknown) => (v && typeof v === "object" ? (v as LexicalDocument) : null);

const counts: Record<string, number> = {};

try {
  await client.query("begin");
  await client.query(
    "truncate cms.form_submissions, cms.forms, cms.redirects, cms.versions, cms.projekte, cms.pages, cms.site_settings restart identity cascade",
  );

  // ---- Pages: parents first, path from the tree -------------------------------------------
  const pageRows = await q(`select * from public.pages order by id`);
  const tree: TreeNode[] = pageRows.map((r) => ({
    id: Number(r.id),
    slug: String(r.slug),
    title: String(r.title ?? ""),
    parentId: r.parent_id === null ? null : Number(r.parent_id),
  }));
  const paths = pathsOf(tree);
  const ordered = [...pageRows].sort(
    (a, b) =>
      paths.get(Number(a.id))!.split("/").length - paths.get(Number(b.id))!.split("/").length,
  );
  for (const r of ordered) {
    const content = json(r.content);
    await client.query(
      `insert into cms.pages (id, slug, parent_id, path, title, lead, content, content_text, meta_title, meta_description,
         meta_image_id, status, published_at, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,null,$11,$12,$13,$14)`,
      [
        Number(r.id),
        r.slug,
        r.parent_id,
        paths.get(Number(r.id)),
        r.title ?? "",
        str(r.lead),
        content,
        content ? plainText(content) : null,
        str(r.meta_title),
        str(r.meta_description),
        r._status === "published" ? "published" : "draft",
        r._status === "published" ? r.updated_at : null,
        r.created_at,
        r.updated_at,
      ],
    );
  }
  counts.pages = ordered.length;
  await client.query(
    `select setval(pg_get_serial_sequence('cms.pages','id'), coalesce(max(id),0)+1, false) from cms.pages`,
  );

  // ---- Projekte ------------------------------------------------------------------------------
  const projektRows = await q(`select * from public.projekte order by id`);
  for (const r of projektRows) {
    const content = json(r.content);
    await client.query(
      `insert into cms.projekte (id, slug, title, kunde, summary, content, content_text, meta_title, meta_description,
         meta_image_id, status, published_at, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,null,$10,$11,$12,$13)`,
      [
        Number(r.id),
        r.slug,
        r.title ?? "",
        r.kunde ?? "",
        r.summary ?? "",
        content,
        content ? plainText(content) : null,
        str(r.meta_title),
        str(r.meta_description),
        r._status === "published" ? "published" : "draft",
        r._status === "published" ? r.updated_at : null,
        r.created_at,
        r.updated_at,
      ],
    );
  }
  counts.projekte = projektRows.length;
  await client.query(
    `select setval(pg_get_serial_sequence('cms.projekte','id'), coalesce(max(id),0)+1, false) from cms.projekte`,
  );

  // ---- Versions: the latest snapshot of every page and project -----------------------------
  const latestPages = await q(
    `select * from public._pages_v where latest = true order by parent_id`,
  );
  for (const v of latestPages) {
    const snapshot = {
      title: v.version_title,
      slug: v.version_slug,
      parentId: v.version_parent_id ?? null,
      lead: str(v.version_lead),
      content: json(v.version_content),
      meta: {
        title: str(v.version_meta_title),
        description: str(v.version_meta_description),
        imageId: null,
      },
    };
    await client.query(
      `insert into cms.versions (collection, doc_id, snapshot, kind, created_at) values ('pages', $1, $2, 'published', $3)`,
      [Number(v.parent_id), JSON.stringify(snapshot), v.updated_at],
    );
  }
  const latestProjekte = await q(
    `select * from public._projekte_v where latest = true order by parent_id`,
  );
  for (const v of latestProjekte) {
    const snapshot = {
      title: v.version_title,
      slug: v.version_slug,
      kunde: v.version_kunde,
      summary: v.version_summary,
      content: json(v.version_content),
      meta: {
        title: str(v.version_meta_title),
        description: str(v.version_meta_description),
        imageId: null,
      },
    };
    await client.query(
      `insert into cms.versions (collection, doc_id, snapshot, kind, created_at) values ('projekte', $1, $2, 'published', $3)`,
      [Number(v.parent_id), JSON.stringify(snapshot), v.updated_at],
    );
  }
  counts.versions = latestPages.length + latestProjekte.length;

  // ---- Site settings: the scalar columns plus the eight array tables --------------------------
  const s = await one(`select * from public.site_settings where id = 1`);
  if (!s) throw new Error("public.site_settings hat keine Zeile 1.");
  const list = <T extends Row>(table: string, parent: unknown = 1) =>
    q<T>(`select * from public.${table} where _parent_id = $1 order by _order`, [parent]);
  const services = await list("site_settings_services");
  // What every page shares goes into the settings; what one page shows goes onto that page.
  const settings: SiteSettings = {
    siteName: String(s.site_name),
    ownerName: String(s.owner_name),
    tagline: str(s.tagline),
    description: str(s.description),
    contactEmail: str(s.contact_email),
    socialLinks: (await list("site_settings_social_links")).map((r) => ({
      id: String(r.id),
      label: String(r.label),
      url: String(r.url),
    })),
    cta: { title: String(s.cta_title), text: str(s.cta_text), label: String(s.cta_label) },
  };
  const parsedSettings = SiteSettingsSchema.parse(settings);
  await client.query(`insert into cms.site_settings (id, data, updated_at) values (1, $1, $2)`, [
    JSON.stringify(parsedSettings),
    s.updated_at ?? new Date(),
  ]);
  await client.query(
    `insert into cms.versions (collection, doc_id, snapshot, kind) values ('site_settings', 1, $1, 'published')`,
    [JSON.stringify(parsedSettings)],
  );

  const home = HomeSectionsSchema.parse({
    kind: "home",
    hero: {
      headline: String(s.hero_headline),
      words: (await list("site_settings_hero_words")).map((r) => ({
        id: String(r.id),
        word: String(r.word),
      })),
      headlineEnd: String(s.hero_headline_end),
      lead: str(s.hero_lead),
    },
    servicesTitle: String(s.services_title),
    stepsTitle: String(s.steps_title),
    steps: (await list("site_settings_steps")).map((r) => ({
      id: String(r.id),
      title: String(r.title),
      text: String(r.text),
    })),
    principlesTitle: String(s.principles_title),
    principles: (await list("site_settings_principles")).map((r) => ({
      id: String(r.id),
      title: String(r.title),
      text: String(r.text),
    })),
  });
  const leistungen = LeistungenSectionsSchema.parse({
    kind: "leistungen",
    services: await Promise.all(
      services.map(async (r) => ({
        id: String(r.id),
        title: String(r.title),
        short: String(r.short),
        slug: String(r.slug),
        glyph: String(r.glyph),
        text: String(r.text),
        examples: (await list("site_settings_services_examples", r.id)).map((e) => ({
          id: String(e.id),
          text: String(e.text),
        })),
      })),
    ),
    faq: (await list("site_settings_faq")).map((r) => ({
      id: String(r.id),
      question: String(r.question),
      answer: String(r.answer),
    })),
  });
  await client.query(`update cms.pages set sections = $1 where slug = 'startseite'`, [
    JSON.stringify(home),
  ]);
  await client.query(
    `update cms.pages set sections = $1, lead = coalesce(lead, $2) where slug = 'leistungen'`,
    [JSON.stringify(leistungen), str(s.services_intro)],
  );
  // /projekte and /kontakt had no page in Payload: they get one now.
  const routedPages = [
    {
      slug: "projekte",
      title: "Projekte",
      lead: str(s.projekte_lead),
      sections: ProjekteSectionsSchema.parse({ kind: "projekte", empty: str(s.projekte_empty) }),
    },
    {
      slug: "kontakt",
      title: "Kontakt",
      lead: str(s.kontakt_lead),
      sections: KontaktSectionsSchema.parse({
        kind: "kontakt",
        nextTitle: str(s.kontakt_next_title),
        nextText: json(s.kontakt_next_text),
      }),
    },
  ];
  for (const page of routedPages) {
    await client.query(
      `insert into cms.pages (slug, path, title, lead, sections, status, published_at)
       values ($1, $2, $3, $4, $5, 'published', now()) on conflict (slug) do nothing`,
      [page.slug, `/${page.slug}`, page.title, page.lead, JSON.stringify(page.sections)],
    );
  }
  counts.site_settings = 1;

  // ---- Forms: fields from the block tables, in order ----------------------------------------
  const formRows = await q(`select * from public.forms order by id`);
  for (const f of formRows) {
    const blocks: (FormField & { _order: number })[] = [];
    const base = (r: Row) => ({
      id: String(r.id),
      name: String(r.name),
      label: str(r.label),
      required: r.required === true,
      width: num(r.width),
      _order: Number(r._order),
    });
    for (const r of await q(`select * from public.forms_blocks_text where _parent_id = $1`, [f.id]))
      blocks.push({ ...base(r), blockType: "text", defaultValue: str(r.default_value) });
    for (const r of await q(`select * from public.forms_blocks_textarea where _parent_id = $1`, [
      f.id,
    ]))
      blocks.push({ ...base(r), blockType: "textarea", defaultValue: str(r.default_value) });
    for (const r of await q(`select * from public.forms_blocks_email where _parent_id = $1`, [
      f.id,
    ]))
      blocks.push({ ...base(r), blockType: "email" });
    for (const r of await q(`select * from public.forms_blocks_number where _parent_id = $1`, [
      f.id,
    ]))
      blocks.push({ ...base(r), blockType: "number", defaultValue: num(r.default_value) });
    for (const r of await q(`select * from public.forms_blocks_checkbox where _parent_id = $1`, [
      f.id,
    ]))
      blocks.push({ ...base(r), blockType: "checkbox", defaultValue: r.default_value === true });
    for (const r of await q(`select * from public.forms_blocks_select where _parent_id = $1`, [
      f.id,
    ])) {
      const options = await q(
        `select * from public.forms_blocks_select_options where _parent_id = $1 order by _order`,
        [r.id],
      );
      blocks.push({
        ...base(r),
        blockType: "select",
        defaultValue: str(r.default_value),
        placeholder: str(r.placeholder),
        options: options.map((o) => ({
          id: String(o.id),
          label: String(o.label),
          value: String(o.value),
        })),
      });
    }
    for (const r of await q(`select * from public.forms_blocks_message where _parent_id = $1`, [
      f.id,
    ]))
      blocks.push({
        id: String(r.id),
        blockType: "message",
        message: json(r.message),
        _order: Number(r._order),
      });
    blocks.sort((a, b) => a._order - b._order);
    const fields = blocks.map((block) => {
      const { _order, ...field } = block;
      void _order;
      return FormFieldSchema.parse(field);
    });
    await client.query(
      `insert into cms.forms (id, title, fields, submit_button_label, confirmation_message, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [
        Number(f.id),
        f.title,
        JSON.stringify(fields),
        str(f.submit_button_label),
        json(f.confirmation_message),
        f.created_at,
        f.updated_at,
      ],
    );
  }
  counts.forms = formRows.length;
  await client.query(
    `select setval(pg_get_serial_sequence('cms.forms','id'), coalesce(max(id),0)+1, false) from cms.forms`,
  );

  // ---- Submissions ---------------------------------------------------------------------------
  const submissionRows = await q(`select * from public.form_submissions order by id`);
  for (const sub of submissionRows) {
    const data = await q(
      `select field, value from public.form_submissions_submission_data where _parent_id = $1 order by _order`,
      [sub.id],
    );
    await client.query(
      `insert into cms.form_submissions (form_id, data, created_at) values ($1, $2, $3)`,
      [
        sub.form_id,
        JSON.stringify(data.map((d) => ({ field: String(d.field), value: String(d.value) }))),
        sub.created_at,
      ],
    );
  }
  counts.form_submissions = submissionRows.length;

  // ---- Redirects: reference targets from redirects_rels --------------------------------------
  const redirectRows = await q(`select * from public.redirects order by id`);
  for (const r of redirectRows) {
    const rel = await one(
      `select pages_id, projekte_id from public.redirects_rels where parent_id = $1 and path = 'to.reference'`,
      [r.id],
    );
    const toPage = r.to_type === "reference" ? num(rel?.pages_id) : null;
    const toProjekt = r.to_type === "reference" ? num(rel?.projekte_id) : null;
    const toUrl = r.to_type === "custom" ? str(r.to_url) : null;
    if (!toPage && !toProjekt && !toUrl) {
      console.warn(`Weiterleitung ${r.from} übersprungen: kein Ziel.`);
      continue;
    }
    await client.query(
      `insert into cms.redirects ("from", type, to_page_id, to_projekt_id, to_url, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,$7)`,
      [r.from, r.type === "302" ? 307 : 308, toPage, toProjekt, toUrl, r.created_at, r.updated_at],
    );
    counts.redirects = (counts.redirects ?? 0) + 1;
  }
  counts.redirects ??= 0;

  await client.query("commit");
  console.log("Import abgeschlossen:", counts);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
