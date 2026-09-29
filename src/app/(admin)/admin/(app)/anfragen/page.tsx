import { InboxIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getContactForm, listSubmissions } from "@/cms/content/forms";
import { cn } from "@/lib/utils";
import { PageShell } from "../../_components/page-shell";
import { summarize } from "./_lib/summary";

export const metadata: Metadata = { title: "Anfragen" };

const when = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

export default async function InboxPage() {
  const [submissions, form] = await Promise.all([listSubmissions(), getContactForm()]);
  const unread = submissions.filter((s) => !s.readAt).length;
  return (
    <PageShell
      title="Anfragen"
      lead={
        unread > 0
          ? `${unread} ${unread === 1 ? "ungelesene Nachricht" : "ungelesene Nachrichten"} aus dem Kontaktformular.`
          : "Nachrichten aus dem Kontaktformular. Antworten Sie per E-Mail."
      }
    >
      {submissions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>Noch keine Anfrage</EmptyTitle>
            <EmptyDescription>
              Was über /kontakt gesendet wird, landet hier — und nur hier.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ol className="divide-y rounded-lg border">
          {submissions.map((s, index) => {
            const { name, email, message } = summarize(s, form);
            const unreadItem = !s.readAt;
            return (
              <li
                key={s.id}
                className="rise-in"
                style={{ "--rise-index": index } as React.CSSProperties}
              >
                <Link
                  href={`/admin/anfragen/${s.id}` as never}
                  className="grid gap-1 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] sm:items-baseline sm:gap-4"
                >
                  <span
                    className={cn(
                      "flex items-center gap-2 truncate",
                      unreadItem && "font-semibold",
                    )}
                  >
                    {unreadItem ? (
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full bg-primary"
                      />
                    ) : null}
                    <span className="truncate">{name}</span>
                    {unreadItem ? (
                      <Badge variant="secondary" className="sr-only">
                        ungelesen
                      </Badge>
                    ) : null}
                  </span>
                  <span className="truncate text-muted-foreground">{message}</span>
                  <span className="text-xs text-muted-foreground tabular-nums sm:text-right">
                    {when.format(s.createdAt)}
                  </span>
                  {email ? <span className="sr-only">{email}</span> : null}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </PageShell>
  );
}
