"use client";

import { RepeatIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { aboRechnungenAction } from "../../../_actions/buero";

// Contract periods due and not yet billed: one click prepares their drafts.
export function AboHinweis({ zeitraeume, vertraege }: { zeitraeume: number; vertraege: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const vorbereiten = async () => {
    setBusy(true);
    const result = await aboRechnungenAction();
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    const n = result.data?.entwuerfe ?? 0;
    toast.success(n === 1 ? "Ein Entwurf liegt bereit." : `${n} Entwürfe liegen bereit.`);
    router.refresh();
  };
  return (
    <Alert className="rise-in">
      <RepeatIcon />
      <AlertTitle>
        {zeitraeume === 1
          ? "Ein Abrechnungszeitraum ist fällig"
          : `${zeitraeume} Abrechnungszeiträume sind fällig`}
      </AlertTitle>
      <AlertDescription>
        Aus {vertraege === 1 ? "einem Vertrag" : `${vertraege} Verträgen`} mit laufender Vergütung.
        Die Entwürfe prüfen und stellen Sie wie jede Rechnung.
      </AlertDescription>
      <AlertAction>
        <Button type="button" size="sm" disabled={busy} onClick={() => void vorbereiten()}>
          {busy ? <Spinner data-icon="inline-start" /> : null}
          Entwürfe vorbereiten
        </Button>
      </AlertAction>
    </Alert>
  );
}
