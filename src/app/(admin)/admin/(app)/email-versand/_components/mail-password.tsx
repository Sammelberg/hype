"use client";

// The mailbox password in a dialog of its own (sealed on the server, never shown again), and
// deleting it.
import { KeyRoundIcon, Trash2Icon } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { clearMailPasswordAction, setMailPasswordAction } from "../../../_actions/mail";
import { PasswordField } from "../../../_components/password-field";

export function PasswordActions({ passwordSaved }: { passwordSaved: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const speichern = async (formData: FormData) => {
    setBusy(true);
    const result = await setMailPasswordAction({ password: String(formData.get("password")) });
    setBusy(false);
    if (result.serverError) return void setError(result.serverError.message);
    setOpen(false);
    toast.success("Passwort gespeichert.");
    router.refresh();
  };

  const loeschen = async () => {
    const result = await clearMailPasswordAction();
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Gespeichertes Passwort gelöscht.");
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setError(undefined);
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" variant={passwordSaved ? "outline" : "default"}>
            <KeyRoundIcon data-icon="inline-start" />
            {passwordSaved ? "Passwort ändern" : "Passwort eingeben"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form action={speichern} className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>Passwort Ihres E-Mail-Kontos</DialogTitle>
              <DialogDescription>
                Es wird verschlüsselt gespeichert und nicht wieder angezeigt. Welches Passwort Ihr
                Anbieter erwartet, steht unter „E-Mail-Anbieter“.
              </DialogDescription>
            </DialogHeader>
            <PasswordField
              id="postfach-passwort"
              name="password"
              label="Passwort"
              autoComplete="current-password"
              error={error}
            />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {busy ? <Spinner data-icon="inline-start" /> : null}
                Passwort speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {passwordSaved ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost">
              <Trash2Icon data-icon="inline-start" />
              Passwort löschen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Gespeichertes Passwort löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Danach sendet die Website keine E-Mails mehr, bis Sie es neu eingeben.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={loeschen}>
                Passwort löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
