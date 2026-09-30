import { InboxIcon } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getContactForm, listSubmissions } from "@/cms/content/forms";
import { cn } from "@/lib/utils";
import { CardLink, cardLinkSurface } from "../../_components/card-link";
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
        <div className="@container">
          <ol role="list" className="grid items-start gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
            {submissions.map((s, index) => {
              const { name, email, message } = summarize(s, form);
              const unreadItem = !s.readAt;
              return (
                <li
                  key={s.id}
                  className="rise-in"
                  style={{ "--rise-index": index } as React.CSSProperties}
                >
                  <Card className={cn(cardLinkSurface, unreadItem && "ring-primary/40")}>
                    <CardHeader>
                      <CardTitle className={cn("truncate text-lg", unreadItem && "font-semibold")}>
                        <CardLink href={`/admin/anfragen/${s.id}`}>{name}</CardLink>
                      </CardTitle>
                      {email && email !== name ? (
                        <CardDescription className="truncate">{email}</CardDescription>
                      ) : null}
                      {unreadItem ? (
                        <CardAction>
                          <Badge>Neu</Badge>
                        </CardAction>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-4 text-pretty whitespace-pre-line text-muted-foreground">
                        {message}
                      </p>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground tabular-nums">
                      Eingegangen {when.format(s.createdAt)}
                    </CardFooter>
                  </Card>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </PageShell>
  );
}
