import { CircleCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/cms/auth/guard";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { offenePosten } from "@/buero/daten/forderungen";
import { datumDe, heute } from "@/buero/logik/ablauf";
import { mahnTitel } from "@/buero/logik/forderung";
import { euro } from "@/buero/logik/geld";
import { cn } from "@/lib/utils";
import { PageShell } from "../../_components/page-shell";

export const metadata: Metadata = { title: "Offene Posten" };

// Every issued invoice with something still open, the longest overdue first, with its last
// reminder — the list to work through when money is late.
export default async function OffenePostenPage() {
  await requireRole("admin");
  const tag = heute();
  const posten = await offenePosten(tag);
  const summe = posten.reduce((s, p) => s + p.offen, 0);
  const ueber = posten.filter((p) => p.tageUeberfaellig > 0);
  return (
    <PageShell
      title="Offene Posten"
      lead={
        posten.length === 0
          ? "Alle gestellten Rechnungen sind bezahlt."
          : `${euro(summe)} offen in ${posten.length} ${posten.length === 1 ? "Rechnung" : "Rechnungen"}${ueber.length ? `, ${euro(ueber.reduce((s, p) => s + p.offen, 0))} davon überfällig` : ""}.`
      }
      wide
    >
      {posten.length === 0 ? (
        <Empty className="rise-in">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleCheckIcon />
            </EmptyMedia>
            <EmptyTitle>Nichts offen</EmptyTitle>
            <EmptyDescription>
              Sobald eine Rechnung gestellt ist, steht sie hier, bis sie bezahlt ist.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rise-in overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rechnung</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Fällig</TableHead>
                <TableHead>Gemahnt</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead className="text-right">Offen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posten.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/rechnungen/${p.id}` as never} className="hover:underline">
                      {p.nummer}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/kunden/${p.kundeId}` as never} className="hover:underline">
                      {p.kundeName}
                    </Link>
                  </TableCell>
                  <TableCell className={cn(p.tageUeberfaellig > 0 && "text-warning font-medium")}>
                    {datumDe(p.faelligAm)}
                    {p.tageUeberfaellig > 0 ? ` · ${p.tageUeberfaellig} Tage drüber` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.mahnstufe === null
                      ? "—"
                      : `${mahnTitel(p.mahnstufe)}${p.letzteFrist ? `, Frist ${datumDe(p.letzteFrist)}` : ""}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{euro(p.brutto)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {euro(p.offen)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>Summe</TableCell>
                <TableCell className="text-right tabular-nums">{euro(summe)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
