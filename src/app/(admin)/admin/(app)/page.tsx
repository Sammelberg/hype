import {
  BriefcaseIcon,
  CircleDashedIcon,
  ClockAlertIcon,
  ReceiptIcon,
  FileTextIcon,
  FolderKanbanIcon,
  ImageIcon,
  InboxIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAuftraege } from "@/buero/daten/auftraege";
import { listRechnungen } from "@/buero/daten/rechnungen";
import { listVertraege, vertragsende } from "@/buero/daten/vertraege";
import { datumDe, heute, tagePlus } from "@/buero/logik/ablauf";
import { centAusBetrag, euro } from "@/buero/logik/geld";
import { requireUser } from "@/cms/auth/guard";
import { isAdmin } from "@/cms/auth/roles";
import { getContactForm, listSubmissions, submissionsPerWeek } from "@/cms/content/forms";
import { listMedia } from "@/cms/content/media";
import { listPages } from "@/cms/content/pages";
import { listProjekte } from "@/cms/content/projekte";
import { publicationsPerWeek, recentPublications } from "@/cms/content/versions";
import { CardLink, tileLinkSurface } from "../_components/card-link";
import { PageShell } from "../_components/page-shell";
import { DokumentKachel } from "../_components/buero/kachel";
import { RechnungStatus, VertragStatus } from "../_components/buero/status";
import { StatusBadge } from "../_components/status-badge";
import { summarize } from "./anfragen/_lib/summary";
import { Reveal } from "./_components/reveal";
import { StatCard } from "./_components/stat-card";
import { WeeklyChart } from "./_components/weekly-chart";

export const metadata: Metadata = { title: "Übersicht" };

const when = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

const greeting = (hour: number) =>
  hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ passwort?: string }>;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);
  const [
    { passwort },
    pages,
    projekte,
    media,
    submissions,
    form,
    perWeek,
    published,
    recent,
    rechnungen,
    auftraege,
    vertraege,
  ] = await Promise.all([
    searchParams,
    listPages(),
    listProjekte(),
    listMedia(),
    listSubmissions({ limit: 6 }),
    getContactForm(),
    submissionsPerWeek(12),
    publicationsPerWeek(12),
    recentPublications(6),
    // The office only for admins (src/cms/auth/roles.ts).
    admin ? listRechnungen() : [],
    admin ? listAuftraege() : [],
    admin ? listVertraege() : [],
  ]);
  // The office at a glance: what is owed, what is late, what runs, which notice dates come up.
  const tag = heute();
  const offen = rechnungen.filter((r) => r.typ === "rechnung" && r.status === "gestellt");
  const ueberfaellig = offen.filter((r) => r.faelligAm && r.faelligAm < tag);
  const laufend = auftraege.filter((a) =>
    ["beauftragt", "in_arbeit", "abgenommen"].includes(a.status),
  );
  const bald = tagePlus(tag, 60);
  const fristen = vertraege
    .map((v) => ({ v, ende: vertragsende(v, tag) }))
    .filter((x) => x.ende?.kuendigenBis && x.ende.kuendigenBis <= bald)
    .sort((a, b) => a.ende!.kuendigenBis!.localeCompare(b.ende!.kuendigenBis!));
  const unread = submissions.filter((s) => !s.readAt).length;
  const drafts = [...pages, ...projekte]
    .filter((d) => d.status === "draft" || d.hasDraft)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const hour = Number(
    new Intl.DateTimeFormat("de-DE", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Berlin",
    }).format(new Date()),
  );
  const firstName = user.name?.split(" ")[0];

  return (
    <PageShell
      title={`${greeting(hour)}${firstName ? `, ${firstName}` : ""}`}
      lead={
        passwort === "geaendert"
          ? "Ihr Passwort ist geändert. Auf anderen Geräten sind Sie abgemeldet."
          : "Was auf der Website steht, was hereinkam und was noch nicht veröffentlicht ist."
      }
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Anfragen ungelesen"
          value={unread}
          hint={`${submissions.length >= 6 ? "6+" : submissions.length} zuletzt`}
          href="/admin/anfragen"
          icon={<InboxIcon />}
        />
        <StatCard
          index={1}
          label="Seiten online"
          value={pages.filter((p) => p.status === "published").length}
          hint={`${pages.length} insgesamt`}
          href="/admin/seiten"
          icon={<FileTextIcon />}
        />
        <StatCard
          index={2}
          label="Projekte online"
          value={projekte.filter((p) => p.status === "published").length}
          hint={`${projekte.length} insgesamt`}
          href="/admin/projekte"
          icon={<FolderKanbanIcon />}
        />
        <StatCard
          index={3}
          label="Bilder"
          value={media.length}
          hint="in der Medienablage"
          href="/admin/medien"
          icon={<ImageIcon />}
        />
      </div>

      {admin ? (
        <section aria-label="Büro" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            index={4}
            label="Rechnungen offen"
            value={offen.length}
            hint={euro(offen.reduce((sum, r) => sum + centAusBetrag(r.summeBrutto), 0))}
            href="/admin/rechnungen"
            icon={<ReceiptIcon />}
          />
          <StatCard
            index={5}
            label="Überfällig"
            value={ueberfaellig.length}
            hint={ueberfaellig.length ? "Zahlungsziel verstrichen" : "Keine"}
            href="/admin/rechnungen"
            icon={<ClockAlertIcon />}
          />
          <StatCard
            index={6}
            label="Aufträge laufend"
            value={laufend.length}
            hint={`${auftraege.filter((a) => a.status === "angebot").length} Angebote offen`}
            href="/admin/auftraege"
            icon={<BriefcaseIcon />}
          />
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Fristen</CardTitle>
              <CardDescription>
                {ueberfaellig.length + fristen.length === 0
                  ? "Nichts wird in den nächsten 60 Tagen fällig."
                  : "Überfällige Rechnungen und Kündigungstermine der nächsten 60 Tage."}
              </CardDescription>
            </CardHeader>
            {ueberfaellig.length + fristen.length > 0 ? (
              <CardContent>
                <ul role="list" className="flex flex-col gap-2">
                  {ueberfaellig.slice(0, 4).map((r) => (
                    <DokumentKachel
                      key={`r-${r.id}`}
                      href={`/admin/rechnungen/${r.id}`}
                      titel={r.nummer ?? "Rechnung"}
                      unter={`${r.kundeName}, fällig ${datumDe(r.faelligAm!)}`}
                      status={<RechnungStatus status={r.status} ueberfaellig typ={r.typ} />}
                    />
                  ))}
                  {fristen.slice(0, 4).map(({ v, ende }) => (
                    <DokumentKachel
                      key={`v-${v.id}`}
                      href={`/admin/vertraege/${v.id}`}
                      titel={v.titel}
                      unter={`Kündbar bis ${datumDe(ende!.kuendigenBis!)}`}
                      status={<VertragStatus status={v.status} />}
                    />
                  ))}
                </ul>
              </CardContent>
            ) : null}
          </Card>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle>Anfragen pro Woche</CardTitle>
              <CardDescription>Die letzten zwölf Wochen aus dem Kontaktformular.</CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyChart data={perWeek} label="Anfragen" />
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.06}>
          <Card>
            <CardHeader>
              <CardTitle>Veröffentlichungen pro Woche</CardTitle>
              <CardDescription>
                Seiten, Projekte und Einstellungen, die online gingen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyChart data={published} label="Veröffentlichungen" color="var(--chart-2)" />
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Reveal className="xl:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDashedIcon className="size-4 text-muted-foreground" aria-hidden="true" />{" "}
                Noch nicht veröffentlicht
              </CardTitle>
              <CardDescription>
                {drafts.length === 0
                  ? "Alles, was hier steht, ist online."
                  : `${drafts.length} ${drafts.length === 1 ? "Dokument wartet" : "Dokumente warten"}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul role="list" className="flex flex-col gap-2">
                {drafts.slice(0, 6).map((d) => (
                  <li
                    key={`${"kunde" in d ? "p" : "s"}-${d.id}`}
                    className={`${tileLinkSurface} flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2`}
                  >
                    <CardLink
                      tile
                      href={"kunde" in d ? `/admin/projekte/${d.id}` : `/admin/seiten/${d.id}`}
                      className="truncate"
                    >
                      {d.title}
                    </CardLink>
                    <StatusBadge status={d.status} hasDraft={d.hasDraft} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.06} className="xl:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Letzte Anfragen</CardTitle>
              <CardDescription>
                {submissions.length === 0 ? "Noch keine Nachricht." : "Antworten Sie per E-Mail."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul role="list" className="flex flex-col gap-2">
                {submissions.map((s) => {
                  const { name, message } = summarize(s, form);
                  return (
                    <li
                      key={s.id}
                      className={`${tileLinkSurface} rounded-lg border bg-muted/40 px-3 py-2`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <CardLink
                          tile
                          href={`/admin/anfragen/${s.id}`}
                          className={s.readAt ? "truncate" : "truncate font-semibold"}
                        >
                          {name}
                        </CardLink>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {when.format(s.createdAt)}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{message}</p>
                    </li>
                  );
                })}
              </ul>
              {submissions.length > 0 ? (
                <Button asChild variant="ghost" size="sm" className="mt-2">
                  <Link href={"/admin/anfragen" as never}>Alle Anfragen</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.12} className="xl:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Zuletzt veröffentlicht</CardTitle>
              <CardDescription>Wer wann was online gestellt hat.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative flex flex-col gap-4 border-l pl-4">
                {recent.map((r) => (
                  <li key={r.id} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full border-2 border-background bg-primary"
                    />
                    <p className="truncate">
                      {r.path ? (
                        <Link
                          href={r.path as never}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {r.title}
                        </Link>
                      ) : (
                        r.title
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {when.format(r.createdAt)}
                      {r.userName ? ` · ${r.userName}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </PageShell>
  );
}
