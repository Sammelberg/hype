"use client";

import {
  CopyIcon,
  KeyRoundIcon,
  LockOpenIcon,
  LogOutIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ROLE_LABELS, ROLES, type Role } from "@/cms/auth/roles";
import type { User } from "@/cms/content/types";
import {
  createUserAction,
  deleteUserAction,
  resetUserPasswordAction,
  setUserRoleAction,
  signOutEverywhereAction,
  unlockUserAction,
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
  // New accounts start with the smaller role; an admin can raise it.
  const [role, setRole] = useState<Role>("redakteur");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await createUserAction({ name: name || null, email, role });
    setBusy(false);
    if (result.serverError) return setError(result.serverError.message);
    if (!result.data) return setError("Das hat nicht geklappt.");
    setOpen(false);
    setName("");
    setEmail("");
    setRole("redakteur");
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
            <FieldSet>
              <FieldLegend variant="label">Rolle</FieldLegend>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as Role)}>
                {ROLES.map((r) => (
                  <FieldLabel key={r} htmlFor={`new-user-role-${r}`}>
                    <Field orientation="horizontal">
                      <RadioGroupItem value={r} id={`new-user-role-${r}`} />
                      <FieldContent>
                        <FieldTitle>{ROLE_LABELS[r].name}</FieldTitle>
                        <FieldDescription>{ROLE_LABELS[r].hint}</FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </FieldSet>
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
  const run = async (
    action: Promise<{ serverError?: { message: string } } | undefined>,
    done: string,
  ) => {
    const result = await action;
    if (result?.serverError) return void toast.error(result.serverError.message);
    toast.success(done);
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
      <div className="@container">
        <ul role="list" className="grid items-start gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
          {users.map((user, index) => {
            const locked = user.lockedUntil !== null && user.lockedUntil > new Date();
            return (
              <li
                key={user.id}
                className="rise-in"
                style={{ "--rise-index": index } as React.CSSProperties}
              >
                <Card>
                  <CardHeader className="grid-cols-[auto_minmax(0,1fr)] gap-x-3">
                    <Avatar size="lg" className="row-span-2">
                      <AvatarFallback>
                        {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="truncate text-lg">{user.name ?? user.email}</CardTitle>
                    <CardDescription className="truncate">
                      {user.name ? user.email : "ohne Namen"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {/* Others show their role in the select below; the own one is fixed. */}
                    <div className="flex flex-wrap gap-1.5 empty:hidden">
                      {user.id === currentUserId ? (
                        <>
                          <Badge>{ROLE_LABELS[user.role].name}</Badge>
                          <Badge variant="secondary">Sie</Badge>
                        </>
                      ) : null}
                      {user.mustChangePassword ? (
                        <Badge variant="outline">wartet auf eigenes Passwort</Badge>
                      ) : null}
                      {locked ? <Badge variant="destructive">gesperrt</Badge> : null}
                    </div>
                    <p className="text-muted-foreground">
                      {user.lastLoginAt
                        ? `Zuletzt angemeldet ${when.format(user.lastLoginAt)}`
                        : "Noch nie angemeldet"}
                    </p>
                    {user.id === currentUserId ? null : (
                      <Field orientation="horizontal" className="items-center">
                        <FieldLabel htmlFor={`role-${user.id}`} className="w-auto">
                          Rolle
                        </FieldLabel>
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            void run(
                              setUserRoleAction({ id: user.id, role: value as Role }),
                              `${user.name ?? user.email}: ${ROLE_LABELS[value as Role].name}.`,
                            )
                          }
                        >
                          <SelectTrigger id={`role-${user.id}`} className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABELS[r].name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </CardContent>
                  <CardFooter className="flex-wrap justify-end gap-1">
                    {locked ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void run(unlockUserAction({ id: user.id }), "Entsperrt.")}
                      >
                        <LockOpenIcon data-icon="inline-start" /> Entsperren
                      </Button>
                    ) : null}
                    {user.id === currentUserId ? null : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`${user.name ?? user.email} überall abmelden`}
                          >
                            <LogOutIcon data-icon="inline-start" /> Überall abmelden
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Überall abmelden?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Alle Sitzungen von {user.email} enden sofort, auf jedem Gerät. Das
                              Passwort bleibt; zum Weiterarbeiten meldet sich die Person neu an.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                void run(
                                  signOutEverywhereAction({ id: user.id }),
                                  "Überall abgemeldet.",
                                )
                              }
                            >
                              Abmelden
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <KeyRoundIcon data-icon="inline-start" /> Neues Passwort
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Vorläufiges Passwort vergeben?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Das alte Passwort gilt sofort nicht mehr, alle Sitzungen dieser Person
                            enden. Sie sehen das neue Passwort einmal.
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
                            size="sm"
                            aria-label={`Zugang von ${user.name ?? user.email} löschen`}
                          >
                            <Trash2Icon data-icon="inline-start" /> Löschen
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
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => void remove(user.id)}
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
      {users.length === 0 ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <UserIcon aria-hidden="true" /> Keine Zugänge.
        </p>
      ) : null}
      {shown ? <TemporaryPassword password={shown} onClose={() => setShown(null)} /> : null}
    </div>
  );
}
