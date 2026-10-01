import {
  BanknoteIcon,
  CircleDashedIcon,
  ClockAlertIcon,
  FileTextIcon,
  FolderKanbanIcon,
  ImageIcon,
  InboxIcon,
  ReceiptIcon,
  RepeatIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { faelligeAboZeitraeume } from "@/buero/daten/abo";
import { listAngebote } from "@/buero/daten/angebote";
import { journal } from "@/buero/daten/export";
import { eingaengeNachMonat, offenePosten } from "@/buero/daten/forderungen";
import { listWiedervorlagen } from "@/buero/daten/historie";
import { listVertraege, vertragsende } from "@/buero/daten/vertraege";
import { datumDe, heute, monatePlus, tagePlus } from "@/buero/logik/ablauf";
import { ustNachMonat } from "@/buero/logik/export";
import { mahnTitel } from "@/buero/logik/forderung";
import { euro, rechnungsSummen } from "@/buero/logik/geld";
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
import { AngebotStatus, VertragStatus } from "../_components/buero/status";
import { NeueWiedervorlage, WiedervorlagenListe } from "../_components/buero/wiedervorlage";
import { StatusBadge } from "../_components/status-badge";
import { summarize } from "./anfragen/_lib/summary";
import { Reveal } from "./_components/reveal";
import { MonatsChart, type MonatsPunkt } from "./_components/monats-chart";
import { StatCard } from "./_components/stat-card";
import { WeeklyChart } from "./_components/weekly-chart";

export const metadata: Metadata = { title: "Übersicht" };

const when = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

const greeting = (hour: number) =>
  hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

// Twelve months back to the first of the month, for the money chart.
const zwoelfMonate = (tag: string) => `${monatePlus(tag, -11).slice(0, 7)}-01`;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ passwort?: string }>;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);
  const seit = zwoelfMonate(heute());
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
    vertraege,
    posten,
    wiedervorlagen,
    angebote,
    abo,
    gestellt,
    eingaenge,
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
    admin ? listVertraege() : [],
    admin ? offenePosten() : [],
    admin ? listWiedervorlagen({ bis: tagePlus(heute(), 0) }) : [],
    admin ? listAngebote() : [],
    admin ? faelligeAboZeitraeume() : [],
    admin ? journal(seit, heute()) : [],
    admin ? eingaengeNachMonat(seit) : [],
  ]);
  // The office at a glance: what is due today, what is owed and late, what was earned, which
  // offers wait for an answer, which notice dates come up.
  const tag = heute();
  const offenSumme = posten.reduce((s, p) => s + p.offen, 0);
  const ueberfaellig = posten.filter((p) => p.tageUeberfaellig > 0);
  const ueberfaelligSumme = ueberfaellig.reduce((s, p) => s + p.offen, 0);
  const beimKunden = angebote
    .filter((a) => a.status === "versendet")
    .sort((a, b) => (a.gueltigBis ?? "9999").localeCompare(b.gueltigBis ?? "9999"));
  const aboZeitraeume = abo.reduce((s, a) => s + a.zeitraeume.length, 0);
  const umsatzMonate = ustNachMonat(gestellt);
  const monate: MonatsPunkt[] = Array.from({ length: 12 }, (_, i) => {
    const monat = monatePlus(seit, i).slice(0, 7);
    const u = umsatzMonate.find((m) => m.monat === monat);
    const e = eingaenge.find((m) => m.monat === monat);
    return {
      monat,
      umsatz: u ? (u.netto19 + u.netto7 + u.netto0) / 100 : 0,
      eingang: e ? e.cent / 100 : 0,
    };
  });
  const jahr = tag.slice(0, 4);
  const umsatzJahr = umsatzMonate
    .filter((m) => m.monat.startsWith(jahr))
    .reduce((s, m) => s + m.netto19 + m.netto7 + m.netto0, 0);
  const eingangMonat = eingaenge.find((m) => m.monat === tag.slice(0, 7))?.cent ?? 0;
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
          : admin
            ? "Was heute ansteht, was offen ist, und was auf der Website geschieht."
            : "Was auf der Website steht, was hereinkam und was noch nicht veröffentlicht ist."
      }
      wide
    >
      {admin ? (
        <>
          <section aria-label="Heute" className="grid gap-6 xl:grid-cols-3">
            <Card className="rise-in xl:col-span-2">
              <CardHeader>
                <CardTitle>Heute</CardTitle>
                <CardDescription>
                  {wiedervorlagen.length === 0
                    ? "Keine Wiedervorlage fällig."
                    : `${wiedervorlagen.length} ${wiedervorlagen.length === 1 ? "Wiedervorlage" : "Wiedervorlagen"} fällig.`}
                </CardDescription>
                <CardAction>
                  <NeueWiedervorlage heute={tag} label="Vormerken" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <WiedervorlagenListe
                  heute={tag}
                  leer="Nichts für heute. Neues merken Sie mit „Vormerken“ vor."
                  punkte={wiedervorlagen.map((w) => ({
                    id: w.id,
                    titel: w.titel,
                    notiz: w.notiz,
                    faelligAm: w.faelligAm,
                    erledigt: false,
                    kundeId: w.kundeId,
                    kundeName: w.kundeName,
                  }))}
                />
              </CardContent>
            </Card>
            <Card className="rise-in" style={{ "--rise-index": 1 } as React.CSSProperties}>
              <CardHeader>
                <CardTitle>Zu erledigen</CardTitle>
                <CardDescription>
                  {ueberfaellig.length + beimKunden.length + fristen.length + aboZeitraeume === 0
                    ? "Nichts drängt."
                    : "Überfällig, beim Kunden, bald kündbar."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul role="list" className="flex flex-col gap-2">
                  {aboZeitraeume > 0 ? (
                    <DokumentKachel
                      href="/admin/rechnungen"
                      titel="Laufende Rechnungen vorbereiten"
                      unter={`${aboZeitraeume} ${aboZeitraeume === 1 ? "Zeitraum" : "Zeiträume"} aus Verträgen fällig`}
                      status={
                        <RepeatIcon aria-hidden="true" className="size-4 text-primary-soft" />
                      }
                    />
                  ) : null}
                  {ueberfaellig.slice(0, 4).map((p) => (
                    <DokumentKachel
                      key={`r-${p.id}`}
                      href={`/admin/rechnungen/${p.id}`}
                      titel={`${p.nummer} · ${euro(p.offen)}`}
                      unter={`${p.kundeName}, ${p.tageUeberfaellig} Tage überfällig${p.mahnstufe !== null ? `, ${mahnTitel(p.mahnstufe)} geschrieben` : ""}`}
                      status={<ClockAlertIcon aria-hidden="true" className="text-warning size-4" />}
                    />
                  ))}
                  {beimKunden.slice(0, 3).map((a) => (
                    <DokumentKachel
                      key={`a-${a.id}`}
                      href={`/admin/angebote/${a.id}`}
                      titel={a.titel}
                      unter={`${a.kundeName}${a.gueltigBis ? `, gilt bis ${datumDe(a.gueltigBis)}` : ""}`}
                      status={
                        <AngebotStatus
                          status={a.status}
                          abgelaufen={Boolean(a.gueltigBis && a.gueltigBis < tag)}
                        />
                      }
                    />
                  ))}
                  {fristen.slice(0, 3).map(({ v, ende }) => (
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
            </Card>
          </section>

          <section aria-label="Geld" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              index={2}
              label="Offen"
              value={offenSumme}
              euro
              hint={`${posten.length} ${posten.length === 1 ? "Rechnung" : "Rechnungen"}`}
              href="/admin/offene-posten"
              icon={<ReceiptIcon />}
            />
            <StatCard
              index={3}
              label="Überfällig"
              value={ueberfaelligSumme}
              euro
              ton="warnung"
              hint={
                ueberfaellig.length
                  ? `${ueberfaellig.length} über dem Zahlungsziel`
                  : "Alles im Zahlungsziel"
              }
              href="/admin/offene-posten"
              icon={<ClockAlertIcon />}
            />
            <StatCard
              index={4}
              label={`Umsatz ${jahr}`}
              value={umsatzJahr}
              euro
              hint="netto, gestellt"
              href={`/admin/steuerberater?zeitraum=${jahr}`}
              icon={<TrendingUpIcon />}
            />
            <StatCard
              index={5}
              label="Eingang diesen Monat"
              value={eingangMonat}
              euro
              hint={`${beimKunden.length} ${beimKunden.length === 1 ? "Angebot" : "Angebote"} beim Kunden über ${euro(beimKunden.reduce((s, a) => s + rechnungsSummen(a.positionen, false).netto, 0))}`}
              href="/admin/rechnungen"
              icon={<BanknoteIcon />}
            />
          </section>

          <Reveal>
            <Card>
              <CardHeader>
                <CardTitle>Umsatz und Eingang</CardTitle>
                <CardDescription>
                  Die letzten zwölf Monate: gestellt nach Rechnungsdatum, eingegangen nach
                  Zahlungstag.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonatsChart data={monate} />
              </CardContent>
            </Card>
          </Reveal>
        </>
      ) : null}

      <section aria-label="Website" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

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
                    <StatusBadge status={d.status} hasDraft={d.hasDraft} publishAt={d.publishAt} />
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
