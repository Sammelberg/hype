"use client";

import { BanknoteIcon, FileCodeIcon, PrinterIcon, Undo2Icon } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { bezahltAction, stornoAction } from "../../../_actions/buero";

// What happens to an issued invoice: printed, sent as E-Rechnung, paid, or cancelled by a Storno.
export function RechnungAktionen({
  id,
  nummer,
  status,
  typ,
  xrechnungMoeglich,
  heute,
}: {
  id: number;
  nummer: string;
  status: "gestellt" | "bezahlt" | "storniert";
  typ: "rechnung" | "storno";
  xrechnungMoeglich: boolean;
  heute: string;
}) {
  const router = useRouter();
  const [am, setAm] = useState(heute);
  const [offen, setOffen] = useState(false);

  const bezahlt = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await bezahltAction({ id, am });
    if (result.serverError) return void toast.error(result.serverError.message);
    setOffen(false);
    toast.success(`Rechnung ${nummer} ist bezahlt.`);
    router.refresh();
  };

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
      {status === "gestellt" && typ === "rechnung" ? (
        <Dialog open={offen} onOpenChange={setOffen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm">
              <BanknoteIcon data-icon="inline-start" /> Als bezahlt markieren
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={bezahlt} className="flex flex-col gap-6">
              <DialogHeader>
                <DialogTitle>Zahlung erfassen</DialogTitle>
                <DialogDescription>An welchem Tag ist das Geld eingegangen?</DialogDescription>
              </DialogHeader>
              <Field>
                <FieldLabel htmlFor="bezahlt-am">Eingang am</FieldLabel>
                <Input
                  id="bezahlt-am"
                  type="date"
                  value={am}
                  max={heute}
                  required
                  onChange={(e) => setAm(e.target.value)}
                />
              </Field>
              <DialogFooter>
                <Button type="submit">Als bezahlt markieren</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
