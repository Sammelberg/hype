"use client";

import { FileCodeIcon, PrinterIcon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { stornoAction } from "../../../_actions/buero";

// What happens to an issued invoice: printed, sent as E-Rechnung, or cancelled by a Storno. Payments
// and reminders sit beside it (forderung.tsx).
export function RechnungAktionen({
  id,
  nummer,
  status,
  typ,
  xrechnungMoeglich,
}: {
  id: number;
  nummer: string;
  status: "gestellt" | "bezahlt" | "storniert";
  typ: "rechnung" | "storno";
  xrechnungMoeglich: boolean;
}) {
  const router = useRouter();

  const storno = async () => {
    const result = await stornoAction({ id });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Storno gestellt.");
    if (result.data?.id) router.push(`/admin/rechnungen/${result.data.id}` as never);
  };

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <a href={`/admin/druck/rechnungen/${id}`} target="_blank" rel="noopener noreferrer">
          <PrinterIcon data-icon="inline-start" /> Drucken oder PDF
        </a>
      </Button>
      {xrechnungMoeglich ? (
        <Button asChild variant="outline" size="sm">
          <a href={`/admin/rechnungen/${id}/xrechnung`} download>
            <FileCodeIcon data-icon="inline-start" /> XRechnung laden
          </a>
        </Button>
      ) : null}
      {status !== "storniert" && typ === "rechnung" ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Undo2Icon data-icon="inline-start" /> Stornieren
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rechnung {nummer} stornieren?</AlertDialogTitle>
              <AlertDialogDescription>
                Es entsteht eine Rechnungskorrektur mit eigener Nummer und negativen Beträgen, die
                auf diese Rechnung verweist. Senden Sie sie dem Kunden. Danach können Sie eine neue,
                richtige Rechnung stellen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => void storno()}>
                Storno stellen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
