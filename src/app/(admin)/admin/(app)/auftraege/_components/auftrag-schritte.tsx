"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { naechsteStatus, STATUS, type StatusVon } from "@/buero/logik/ablauf";
import { AUFTRAG_STATUS } from "@/buero/logik/texte";
import { setAuftragStatusAction } from "../../../_actions/buero";
import { AuftragStatus } from "../../../_components/buero/status";

type Status = StatusVon<"auftrag">;

// Where the order stands on its way, and the step that comes next. Cancelling asks first.
export function AuftragSchritte({
  id,
  status,
  daten,
}: {
  id: number;
  status: Status;
  daten: { label: string; wert: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Status | null>(null);
  const weiter = naechsteStatus("auftrag", status);
  const vor = weiter.filter((s) => s !== "storniert");
  const stornierbar = weiter.includes("storniert");
  const stufe = STATUS.auftrag.indexOf(status);

  const gehe = async (nach: Status) => {
    setBusy(nach);
    const result = await setAuftragStatusAction({ id, status: nach });
    setBusy(null);
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success(`${AUFTRAG_STATUS[nach].name}.`);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Stand <AuftragStatus status={status} />
        </CardTitle>
        <CardDescription>
          {status === "abgenommen"
            ? "Die nächste Rechnung zu diesem Auftrag setzt ihn auf abgerechnet."
            : status === "abgerechnet"
              ? "Abgerechnet: der Auftrag ist erledigt."
              : status === "storniert"
                ? "Storniert."
                : "Führen Sie den Auftrag Schritt für Schritt weiter."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {status !== "storniert" ? (
          <ol className="flex gap-1" aria-label="Weg des Auftrags">
            {(["angebot", "beauftragt", "in_arbeit", "abgenommen", "abgerechnet"] as const).map(
              (s, i) => (
                <li
                  key={s}
                  aria-current={s === status ? "step" : undefined}
                  className="flex flex-1 flex-col gap-1"
                >
                  <span
                    aria-hidden="true"
                    className={
                      i <= stufe ? "h-1.5 rounded-full bg-primary" : "h-1.5 rounded-full bg-muted"
                    }
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {AUFTRAG_STATUS[s].name}
                  </span>
                </li>
              ),
            )}
          </ol>
        ) : null}
        {daten.length > 0 ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {daten.map((d) => (
              <div key={d.label} className="contents">
                <dt className="text-muted-foreground">{d.label}</dt>
                <dd>{d.wert}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {vor.length > 0 || stornierbar ? (
          <div className="flex flex-wrap gap-2">
            {vor.map((nach) => (
              <Button
                key={nach}
                type="button"
                size="sm"
                disabled={busy !== null}
                onClick={() => gehe(nach)}
              >
                {busy === nach ? <Spinner data-icon="inline-start" /> : null}
                {AUFTRAG_STATUS[nach].schritt}
              </Button>
            ))}
            {stornierbar ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" disabled={busy !== null}>
                    Stornieren
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Auftrag stornieren?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Er bleibt mit seinen Angaben erhalten und lässt sich nicht weiterführen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={() => void gehe("storniert")}>
                      Stornieren
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
