"use client";

import { MailIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { rechnungVersendenAction } from "../../../_actions/versand";

// „Per E-Mail senden“: an offer, never the only way. The dialog is prefilled (customer's address,
// subject, a short letter) and everything in it can be changed; the XRechnung is attached from
// the archive, the PDF is the one the owner saved from „Drucken oder PDF“.
export function RechnungVersand({
  id,
  nummer,
  vorschlag,
  xrechnungMoeglich,
}: {
  id: number;
  nummer: string;
  vorschlag: { to: string; subject: string; text: string };
  xrechnungMoeglich: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<{ error: string; field?: string } | null>(null);
  const feld = (name: string) => (fehler?.field === name ? fehler.error : undefined);

  const senden = async (formData: FormData) => {
    setBusy(true);
    setFehler(null);
    formData.set("id", String(id));
    const result = await rechnungVersendenAction(formData);
    setBusy(false);
    if (!result.ok) return void setFehler(result);
    setOpen(false);
    toast.success(`${nummer} an ${result.to} gesendet.`);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setFehler(null);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <MailIcon data-icon="inline-start" /> Per E-Mail senden
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form action={senden} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{nummer} per E-Mail senden</DialogTitle>
            <DialogDescription>
              Über Ihr Postfach (E-Mail-Versand). Sie können die Rechnung genauso gut weiter
              herunterladen und selbst senden.
            </DialogDescription>
          </DialogHeader>
          {fehler && !fehler.field ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{fehler.error}</AlertDescription>
            </Alert>
          ) : null}
          <Field data-invalid={feld("to") ? true : undefined}>
            <FieldLabel htmlFor="versand-an">An</FieldLabel>
            <Input
              id="versand-an"
              name="to"
              type="email"
              required
              defaultValue={vorschlag.to}
              aria-invalid={feld("to") ? true : undefined}
            />
            {feld("to") ? <FieldError>{feld("to")}</FieldError> : null}
          </Field>
          <Field data-invalid={feld("subject") ? true : undefined}>
            <FieldLabel htmlFor="versand-betreff">Betreff</FieldLabel>
            <Input
              id="versand-betreff"
              name="subject"
              required
              maxLength={300}
              defaultValue={vorschlag.subject}
            />
            {feld("subject") ? <FieldError>{feld("subject")}</FieldError> : null}
          </Field>
          <Field data-invalid={feld("text") ? true : undefined}>
            <FieldLabel htmlFor="versand-text">Nachricht</FieldLabel>
            <Textarea
              id="versand-text"
              name="text"
              required
              rows={9}
              defaultValue={vorschlag.text}
            />
            {feld("text") ? <FieldError>{feld("text")}</FieldError> : null}
          </Field>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-medium">Anhänge</legend>
            <Field orientation="horizontal" data-invalid={feld("xrechnung") ? true : undefined}>
              <Checkbox
                id="versand-xrechnung"
                name="xrechnung"
                defaultChecked={xrechnungMoeglich}
                disabled={!xrechnungMoeglich}
              />
              <FieldLabel htmlFor="versand-xrechnung" className="font-normal">
                XRechnung ({nummer}.xml)
              </FieldLabel>
            </Field>
            {feld("xrechnung") ? <FieldError>{feld("xrechnung")}</FieldError> : null}
            <Field data-invalid={feld("pdf") ? true : undefined}>
              <FieldLabel htmlFor="versand-pdf">PDF der Rechnung (freiwillig)</FieldLabel>
              <Input id="versand-pdf" name="pdf" type="file" accept="application/pdf,.pdf" />
              <FieldDescription>
                „Drucken oder PDF“ → „Als PDF speichern“, dann die Datei hier wählen. Höchstens 1,8
                MB.
              </FieldDescription>
              {feld("pdf") ? <FieldError>{feld("pdf")}</FieldError> : null}
            </Field>
          </fieldset>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : <MailIcon data-icon="inline-start" />}
              Senden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
