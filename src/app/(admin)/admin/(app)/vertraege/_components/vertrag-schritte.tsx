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
import { naechsteStatus, type StatusVon } from "@/buero/logik/ablauf";
import { VERTRAG_STATUS } from "@/buero/logik/texte";
import { setVertragStatusAction } from "../../../_actions/buero";
import { VertragStatus } from "../../../_components/buero/status";

type Status = StatusVon<"vertrag">;

// The contract's state and its next steps. Notice and ending ask first: they are dated today.
export function VertragSchritte({
  id,
  status,
  hinweis,
  daten,
}: {
  id: number;
  status: Status;
  hinweis: string;
  daten: { label: string; wert: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const gehe = async (nach: Status) => {
    setBusy(true);
    const result = await setVertragStatusAction({ id, status: nach });
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success(`${VERTRAG_STATUS[nach].name}.`);
    router.refresh();
  };
  const schritte = naechsteStatus("vertrag", status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Stand <VertragStatus status={status} />
        </CardTitle>
        <CardDescription>{hinweis}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
        {schritte.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {schritte.map((nach) =>
              nach === "aktiv" ? (
                <Button
                  key={nach}
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => gehe(nach)}
                >
                  {VERTRAG_STATUS[nach].schritt}
                </Button>
              ) : (
                <AlertDialog key={nach}>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant={nach === "beendet" ? "ghost" : "outline"}
                      size="sm"
                      disabled={busy}
                    >
                      {VERTRAG_STATUS[nach].schritt}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {nach === "gekuendigt" ? "Kündigung erfassen?" : "Vertrag beenden?"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {nach === "gekuendigt"
                          ? "Die Kündigung gilt ab heute; das Vertragsende folgt aus Laufzeit und Frist. Die Kündigung selbst schicken Sie schriftlich."
                          : "Der Vertrag endet heute und bleibt, wie er ist."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void gehe(nach)}>
                        {VERTRAG_STATUS[nach].schritt}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ),
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
