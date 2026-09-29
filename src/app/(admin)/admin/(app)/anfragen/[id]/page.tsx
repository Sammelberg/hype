import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getContactForm, getSubmission, markSubmissionRead } from "@/cms/content/forms";
import { PageShell } from "../../../_components/page-shell";
import { SubmissionActions } from "../_components/submission-actions";
import { summarize } from "../_lib/summary";

export const metadata: Metadata = { title: "Anfrage" };

const when = new Intl.DateTimeFormat("de-DE", { dateStyle: "full", timeStyle: "short" });

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submissionId = Number(id);
  if (!Number.isInteger(submissionId)) notFound();
  const [submission, form] = await Promise.all([getSubmission(submissionId), getContactForm()]);
  if (!submission) notFound();
  // Opening a message reads it.
  if (!submission.readAt) await markSubmissionRead(submission.id, true);
  const { name, email, labels } = summarize(submission, form);

  return (
    <PageShell
      title={name}
      lead={`Eingegangen am ${when.format(submission.createdAt)}`}
      actions={
        <>
          {email ? (
            <Button asChild size="sm">
              <a href={`mailto:${email}`}>Antworten per E-Mail</a>
            </Button>
          ) : null}
          <SubmissionActions id={submission.id} read={true} />
        </>
      }
    >
      <dl className="grid gap-x-8 gap-y-4 rounded-lg border p-6 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        {submission.data.map((entry) => (
          <div key={entry.field} className="contents">
            <dt className="text-sm text-muted-foreground">
              {labels.get(entry.field) ?? entry.field}
            </dt>
            <dd className="text-pretty whitespace-pre-wrap">{entry.value || "—"}</dd>
          </div>
        ))}
      </dl>
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href={"/admin/anfragen" as never}>Zurück zu den Anfragen</Link>
      </Button>
    </PageShell>
  );
}
