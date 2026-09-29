"use client";

import { CopyIcon, KeyRoundIcon, PlusIcon, Trash2Icon, UserIcon } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import type { User } from "@/cms/content/types";
import {
  createUserAction,
  deleteUserAction,
  resetUserPasswordAction,
} from "../../../_actions/users";

const when = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

// A temporary password is shown exactly once, here; the admin passes it on in person.
function TemporaryPassword({ password, onClose }: { password: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vorläufiges Passwort</DialogTitle>
          <DialogDescription>
            Geben Sie es persönlich weiter. Beim ersten Anmelden muss es durch ein eigenes ersetzt
            werden; danach ist es wertlos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border bg-muted px-3 py-2 font-mono text-lg select-all">
            {password}
          </code>
          <Button
            variant="outline"
            size="icon"
            aria-label="Passwort kopieren"
            onClick={() =>
              navigator.clipboard?.writeText(password).then(() => toast.success("Kopiert."))
            }
          >
            <CopyIcon />
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Verstanden</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewUserDialog({ onCreated }: { onCreated: (password: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await createUserAction({ name: name || null, email });
    setBusy(false);
    if (result.serverError) return setError(result.serverError.message);
    if (!result.data) return setError("Das hat nicht geklappt.");
    setOpen(false);
    setName("");
    setEmail("");
    onCreated(result.data.password);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon data-icon="inline-start" /> Zugang anlegen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
          <DialogHeader>
            <DialogTitle>Neuer Zugang</DialogTitle>
            <DialogDescription>
              Die Person erhält ein vorläufiges Passwort und wählt beim ersten Anmelden ihr eigenes.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-user-name">Name</FieldLabel>
              <Input
                id="new-user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="new-user-email">E-Mail-Adresse</FieldLabel>
              <Input
                id="new-user-email"
                type="email"
                value={email}
                onChange={(e) => (setEmail(e.target.value), setError(null))}
                required
                autoComplete="off"
                aria-invalid={error ? true : undefined}
              />
              <FieldDescription>
                Dient als Anmeldename; es wird keine E-Mail verschickt.
              </FieldDescription>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Anlegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersManager({ users, currentUserId }: { users: User[]; currentUserId: number }) {
  const router = useRouter();
  const [shown, setShown] = useState<string | null>(null);

  const reset = async (id: number) => {
    const result = await resetUserPasswordAction({ id });
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.data) setShown(result.data.password);
    router.refresh();
  };
  const remove = async (id: number) => {
    const result = await deleteUserAction({ id });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Zugang gelöscht.");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <NewUserDialog onCreated={setShown} />
      </div>
      <ItemGroup>
        {users.map((user, index) => (
          <Item
            key={user.id}
            variant="outline"
            className="rise-in"
            style={{ "--rise-index": index } as React.CSSProperties}
          >
            <ItemMedia>
              <Avatar>
                <AvatarFallback>
                  {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="flex items-center gap-2">
                {user.name ?? user.email}
                {user.id === currentUserId ? <Badge variant="secondary">Sie</Badge> : null}
                {user.mustChangePassword ? (
                  <Badge variant="outline">wartet auf eigenes Passwort</Badge>
                ) : null}
                {user.lockedUntil && user.lockedUntil > new Date() ? (
                  <Badge variant="destructive">gesperrt</Badge>
                ) : null}
              </ItemTitle>
              <ItemDescription>
                {user.name ? `${user.email} · ` : ""}
                {user.lastLoginAt
                  ? `zuletzt angemeldet ${when.format(user.lastLoginAt)}`
                  : "noch nie angemeldet"}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <KeyRoundIcon data-icon="inline-start" /> Neues Passwort
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Vorläufiges Passwort vergeben?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Das alte Passwort gilt sofort nicht mehr, alle Sitzungen dieser Person enden.
                      Sie sehen das neue Passwort einmal.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void reset(user.id)}>
                      Passwort vergeben
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {user.id === currentUserId ? null : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Zugang von ${user.name ?? user.email} löschen`}
                    >
                      <Trash2Icon />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Zugang löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {user.email} kann sich danach nicht mehr anmelden. Veröffentlichungen
                        bleiben erhalten.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => void remove(user.id)}>
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      {users.length === 0 ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <UserIcon aria-hidden="true" /> Keine Zugänge.
        </p>
      ) : null}
      {shown ? <TemporaryPassword password={shown} onClose={() => setShown(null)} /> : null}
    </div>
  );
}
