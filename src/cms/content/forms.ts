// The contact form's definition and the messages it received.
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { forms, formSubmissions } from "../db/schema";
import { type FormDoc, type FormInput, FormInputSchema, type Submission } from "./types";

export const CONTACT_FORM_TITLE = "Kontakt";

type Row = typeof forms.$inferSelect;

const toForm = (row: Row): FormDoc => ({
  id: row.id,
  title: row.title,
  fields: row.fields,
  submitButtonLabel: row.submitButtonLabel,
  confirmationMessage: row.confirmationMessage,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export async function getContactForm(): Promise<FormDoc | null> {
  const [row] = await db.select().from(forms).where(eq(forms.title, CONTACT_FORM_TITLE)).limit(1);
  return row ? toForm(row) : null;
}

export async function getForm(id: number): Promise<FormDoc | null> {
  const [row] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  return row ? toForm(row) : null;
}

export async function listForms(): Promise<FormDoc[]> {
  const rows = await db.select().from(forms).orderBy(forms.id);
  return rows.map(toForm);
}

export async function saveForm(id: number, raw: FormInput) {
  const input = FormInputSchema.parse(raw);
  const names = input.fields.flatMap((f) => ("name" in f ? [f.name] : []));
  if (new Set(names).size !== names.length)
    throw new Error("Jeder Feldname darf nur einmal vorkommen.");
  await db
    .update(forms)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(forms.id, id));
}

// Seed and import: create or overwrite by title.
export async function upsertForm(raw: FormInput & { id?: number }) {
  const input = FormInputSchema.parse(raw);
  const [row] = await db
    .insert(forms)
    .values({ ...(raw.id ? { id: raw.id } : {}), ...input })
    .onConflictDoUpdate({ target: forms.title, set: { ...input, updatedAt: new Date() } })
    .returning({ id: forms.id });
  return row!.id;
}

// ---------------------------------------------------------------------------------------------
// Submissions

const toSubmission = (row: typeof formSubmissions.$inferSelect): Submission => ({
  id: row.id,
  formId: row.formId,
  data: row.data,
  readAt: row.readAt,
  createdAt: row.createdAt,
});

export async function createSubmission(formId: number, data: { field: string; value: string }[]) {
  const [row] = await db
    .insert(formSubmissions)
    .values({ formId, data })
    .returning({ id: formSubmissions.id });
  return row!.id;
}

export async function listSubmissions(
  options: { unreadOnly?: boolean; limit?: number } = {},
): Promise<Submission[]> {
  const rows = await db
    .select()
    .from(formSubmissions)
    .where(options.unreadOnly ? isNull(formSubmissions.readAt) : undefined)
    .orderBy(desc(formSubmissions.createdAt))
    .limit(options.limit ?? 500);
  return rows.map(toSubmission);
}

export async function getSubmission(id: number): Promise<Submission | null> {
  const [row] = await db.select().from(formSubmissions).where(eq(formSubmissions.id, id)).limit(1);
  return row ? toSubmission(row) : null;
}

export async function markSubmissionRead(id: number, read: boolean) {
  await db
    .update(formSubmissions)
    .set({ readAt: read ? new Date() : null })
    .where(eq(formSubmissions.id, id));
}

export async function deleteSubmission(id: number) {
  await db.delete(formSubmissions).where(eq(formSubmissions.id, id));
}

export async function countUnreadSubmissions() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(formSubmissions)
    .where(isNull(formSubmissions.readAt));
  return row?.count ?? 0;
}

// Submissions per ISO week for the dashboard, oldest week first.
export async function submissionsPerWeek(weeks = 12): Promise<{ week: string; count: number }[]> {
  const rows = await db.execute<{ week: string; count: number }>(sql`
    with weeks as (
      select generate_series(
        date_trunc('week', now()) - make_interval(weeks => ${weeks - 1}),
        date_trunc('week', now()),
        interval '1 week') as week
    )
    select to_char(weeks.week, 'IYYY-"KW"IW') as week, count(s.id)::int as count
    from weeks
    left join cms.form_submissions s on date_trunc('week', s.created_at) = weeks.week
    group by weeks.week order by weeks.week`);
  return rows.rows;
}

// e2e cleanup: every message that carries the given value in any field.
export async function purgeSubmissionsByValue(value: string) {
  const rows = await db
    .delete(formSubmissions)
    .where(and(sql`${formSubmissions.data} @> ${JSON.stringify([{ value }])}::jsonb`))
    .returning({ id: formSubmissions.id });
  return rows.length;
}

// Messages older than the retention period (src/cms/retention/grenze.ts), read or not.
export async function purgeSubmissionsBefore(boundary: Date, client: Db | Tx = db) {
  const rows = await client
    .delete(formSubmissions)
    .where(lt(formSubmissions.createdAt, boundary))
    .returning({ id: formSubmissions.id });
  return rows.length;
}
