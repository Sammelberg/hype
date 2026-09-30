import { ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AUDIT_PAGE_SIZE, listAudit, verifyAuditChain } from "@/cms/audit/log";
import { AUDIT_ACTIONS, type AuditRow } from "@/cms/audit/types";
import { requireRole } from "@/cms/auth/guard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageShell } from "../../_components/page-shell";
import { ActionFilter } from "./_components/action-filter";

export const metadata: Metadata = { title: "Protokoll" };

const when = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "Europe/Berlin",
});

const label = (action: string) => AUDIT_ACTIONS[action as keyof typeof AUDIT_ACTIONS] ?? action;

// What the entry was about, in words: the path, the number, the address it concerned.
function about(row: AuditRow) {
  const d = row.details;
  const parts = [d.pfad, d.nummer, d.von, d.datei, d.email, d.rolle, d.grund]
    .filter((v) => typeof v === "string" && v)
    .map(String);
  if (parts.length) return parts.join(" · ");
  return row.targetType ? `${row.targetType} ${row.targetId ?? ""}`.trim() : "—";
}

// Who did what and when, newest first. Admins only; nothing here can be changed or removed.
export default async function ProtokollPage({
  searchParams,
}: {
  searchParams: Promise<{ aktion?: string; vor?: string }>;
}) {
  await requireRole("admin");
  const { aktion, vor } = await searchParams;
  const action = aktion && aktion in AUDIT_ACTIONS ? aktion : undefined;
  const before = Number(vor) > 0 ? Number(vor) : undefined;
  const [rows, chain] = await Promise.all([listAudit({ action, before }), verifyAuditChain()]);
  const older = rows.length === AUDIT_PAGE_SIZE ? rows.at(-1)!.id : null;
  const query = (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams(
      Object.entries(params).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(v)]])),
    ).toString();
    return `/admin/protokoll${search ? `?${search}` : ""}`;
  };

  return (
    <PageShell
      title="Protokoll"
      lead="Wer sich angemeldet hat und was veröffentlicht, gelöscht, gestellt oder an Zugängen geändert wurde. Einträge lassen sich weder ändern noch löschen."
      actions={<ActionFilter value={action ?? ""} />}
      wide
    >
      {chain.ok ? (
        <Alert>
          <ShieldCheckIcon />
          <AlertTitle>Lückenlos</AlertTitle>
          <AlertDescription>
            Alle {chain.count.toLocaleString("de-DE")} Einträge sind geprüft: keiner wurde
            nachträglich geändert oder entfernt.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <ShieldAlertIcon />
          <AlertTitle>Das Protokoll wurde verändert</AlertTitle>
          <AlertDescription>
            {chain.reason === "hash"
              ? `Eintrag ${chain.brokenAt} passt nicht mehr zu seinem Prüfwert: er wurde nachträglich geändert.`
              : `Vor Eintrag ${chain.brokenAt} fehlt etwas: ein Eintrag wurde entfernt.`}{" "}
            Das geht nur an der Datenbank vorbei. Bitte prüfen Sie, wer Zugriff auf den Server hat.
          </AlertDescription>
        </Alert>
      )}

      {rows.length === 0 ? (
        <p className="text-muted-foreground">Keine Einträge{action ? " dieser Art" : ""}.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Zeitpunkt</TableHead>
                <TableHead>Wer</TableHead>
                <TableHead>Was</TableHead>
                <TableHead>Worauf</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {when.format(row.at)}
                  </TableCell>
                  <TableCell className="max-w-56 truncate">{row.userEmail ?? "—"}</TableCell>
                  <TableCell>{label(row.action)}</TableCell>
                  <TableCell className="max-w-96 truncate text-muted-foreground">
                    {about(row)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {older || before ? (
        <div className="flex gap-2">
          {before ? (
            <Button asChild variant="outline" size="sm">
              <Link href={query({ aktion: action }) as never}>Neueste</Link>
            </Button>
          ) : null}
          {older ? (
            <Button asChild variant="outline" size="sm">
              <Link href={query({ aktion: action, vor: older }) as never}>Ältere Einträge</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </PageShell>
  );
}
