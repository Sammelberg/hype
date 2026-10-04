"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon, CircleCheckIcon, MailIcon, SaveIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PROVIDERS } from "@/lib/email/providers";
import type { MailStatus } from "@/cms/mail/send";
import {
  EMAIL_KINDS,
  type EmailKind,
  type MailSettings,
  type MailSettingsInput,
  MailSettingsSchema,
} from "@/cms/mail/types";
import { saveMailSettingsAction, sendTestMailAction } from "../../../_actions/mail";
import { AuswahlFeld, ZahlFeld } from "../../../_components/buero/felder";
import { EditorShell } from "../../../_components/editor-shell";
import {
  SectionCard,
  SectionFocusProvider,
  SectionIndex,
  type SectionInfo,
} from "../../../_components/sections";
import { TextField } from "../../../_components/text-field";
import { PasswordActions } from "./mail-password";

const SECURITY = [
  { value: "ssl", label: "SSL/TLS (meist Port 465)" },
  { value: "starttls", label: "STARTTLS (meist Port 587)" },
  { value: "none", label: "Keine – nur für einen Testserver im eigenen Netz" },
];

const zeit = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

type LogItem = { id: number; sentAt: string; to: string; subject: string; kind: string };

// The owner's mailbox: the site sends through it (the password link, new contact messages, and
// what a project adds). Settings are saved with the button; the password has a dialog of its own
// and never comes back to the browser.
export function MailEditor({
  settings,
  passwordSaved,
  status,
  log,
  total,
}: {
  settings: MailSettings;
  passwordSaved: boolean;
  status: MailStatus;
  log: LogItem[];
  total: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const form = useForm<MailSettingsInput, unknown, MailSettings>({
    resolver: zodResolver(MailSettingsSchema),
    defaultValues: settings,
    mode: "onBlur",
  });
  const { control, handleSubmit, formState, reset } = form;
  const providerValue = useWatch({ control, name: "provider" });
  const provider = PROVIDERS.find((option) => option.value === providerValue);
  const custom = providerValue === "andere";

  const sections: SectionInfo[] = [
    { id: "postfach", title: "Ihr Postfach" },
    ...(custom ? [{ id: "server", title: "Postausgangsserver" }] : []),
    { id: "benachrichtigung", title: "Benachrichtigung" },
  ];

  const speichern = handleSubmit(async (input) => {
    setBusy(true);
    const result = await saveMailSettingsAction(input);
    setBusy(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    if (result.validationErrors) return void toast.error("Bitte prüfen Sie die markierten Felder.");
    reset(input);
    toast.success("Gespeichert.");
    router.refresh();
  });

  const testen = async () => {
    setTesting(true);
    const result = await sendTestMailAction();
    setTesting(false);
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success(
      `Test-E-Mail an ${result.data?.to} gesendet. Bitte sehen Sie in Ihrem Postfach nach.`,
    );
    router.refresh();
  };

  const invalid = Object.keys(formState.errors).map((k) =>
    ["host", "port", "security"].includes(k)
      ? "server"
      : k === "notifyAddress"
        ? "benachrichtigung"
        : "postfach",
  );

  return (
    <SectionFocusProvider preview={{ current: null }}>
      <form onSubmit={speichern} noValidate>
        <EditorShell
          backHref="/admin/einstellungen"
          backLabel="Website"
          title="E-Mail-Versand"
          lead="Die Website sendet über Ihr eigenes Postfach; die E-Mails liegen danach in dessen Ordner „Gesendet“."
          nav={<SectionIndex sections={sections} invalid={invalid} />}
          actions={
            <Button type="submit" size="sm" disabled={busy || !formState.isDirty}>
              {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              Speichern
            </Button>
          }
          asideAlways
          aside={
            <div className="flex flex-col gap-4 xl:sticky xl:top-36">
              <Card role="region" aria-labelledby="mail-status-titel">
                <CardHeader>
                  <CardTitle id="mail-status-titel" className="flex items-center gap-2">
                    {status.ready ? (
                      <CircleCheckIcon aria-hidden="true" className="text-success size-4" />
                    ) : (
                      <CircleAlertIcon aria-hidden="true" className="text-warning size-4" />
                    )}
                    {status.ready ? "Eingerichtet" : "Noch nicht eingerichtet"}
                  </CardTitle>
                  <CardDescription>
                    {status.ready ? (
                      <>
                        E-Mails gehen von{" "}
                        <span className="text-foreground">
                          {status.fromName ? `„${status.fromName}“ ` : ""}&lt;{status.address}
                          &gt;
                        </span>{" "}
                        hinaus. Die Test-E-Mail geht an diese Adresse.
                      </>
                    ) : (
                      "Bis alles da ist, sendet die Website nichts. Es fehlt noch:"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 text-sm">
                  {status.ready ? null : (
                    <ul className="flex list-disc flex-col gap-1 pl-5">
                      {status.problems.map((problem) => (
                        <li key={problem}>{problem}</li>
                      ))}
                    </ul>
                  )}
                  <p>
                    Passwort:{" "}
                    <span className={passwordSaved ? "text-success" : "text-muted-foreground"}>
                      {passwordSaved ? "gespeichert" : "noch nicht gespeichert"}
                    </span>
                  </p>
                  <PasswordActions passwordSaved={passwordSaved} />
                  {status.ready ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="self-start"
                      disabled={testing}
                      onClick={testen}
                      aria-label={`Test-E-Mail an ${status.address} senden`}
                    >
                      {testing ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <SendIcon data-icon="inline-start" />
                      )}
                      Test-E-Mail senden
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
              <Card role="region" aria-labelledby="mail-verlauf-titel">
                <CardHeader>
                  <CardTitle id="mail-verlauf-titel">Zuletzt gesendet</CardTitle>
                  {total > 0 ? (
                    <CardDescription>
                      {total.toLocaleString("de-DE")} {total === 1 ? "E-Mail" : "E-Mails"} über
                      dieses Postfach, die neuesten zuerst.
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {log.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MailIcon aria-hidden="true" className="size-4" />
                      Noch keine E-Mail gesendet.
                    </p>
                  ) : (
                    <ul className="flex flex-col divide-y">
                      {log.map((mail) => (
                        <li key={mail.id} className="flex flex-col gap-0.5 py-2.5 first:pt-0">
                          <span className="truncate text-sm font-medium">{mail.subject}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {zeit.format(new Date(mail.sentAt))} ·{" "}
                            {EMAIL_KINDS[mail.kind as EmailKind] ?? mail.kind} an {mail.to}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            <SectionCard
              section={sections[0]!}
              description="Die Adresse, von der die Website sendet, und der Anbieter Ihres Postfachs."
            >
              <AuswahlFeld
                control={control}
                name="provider"
                label="E-Mail-Anbieter"
                leer="Bitte wählen"
                optionen={PROVIDERS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                description={
                  provider
                    ? provider.hint
                    : "Microsoft (Outlook, Microsoft 365) erlaubt nur eine Anmeldung über OAuth und steht deshalb nicht zur Wahl."
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={control} name="fromAddress" label="Absenderadresse" />
                <TextField
                  control={control}
                  name="fromName"
                  label="Absendername"
                  description="So erscheinen Sie im Postfach der Empfänger."
                />
              </div>
              <TextField
                control={control}
                name="username"
                label="Anmeldename"
                description="Nur ausfüllen, wenn er sich von der Absenderadresse unterscheidet."
              />
            </SectionCard>

            {custom ? (
              <SectionCard
                section={sections[1]!}
                description="Die Angaben stehen in der Hilfe Ihres Anbieters unter „SMTP“ oder „Postausgangsserver“."
              >
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                  <TextField control={control} name="host" label="Postausgangsserver (SMTP)" />
                  <ZahlFeld control={control} name="port" label="Port" />
                </div>
                <AuswahlFeld
                  control={control}
                  name="security"
                  label="Verschlüsselung"
                  leer="Bitte wählen"
                  optionen={SECURITY}
                />
              </SectionCard>
            ) : null}

            <SectionCard
              section={sections.at(-1)!}
              description="Wer per E-Mail erfährt, dass über das Kontaktformular eine Nachricht kam. Die Nachricht selbst steht unter „Anfragen“."
            >
              <TextField
                control={control}
                name="notifyAddress"
                label="Neue Anfragen melden an"
                description="Leer lassen, wenn niemand benachrichtigt werden soll."
              />
            </SectionCard>
          </div>
        </EditorShell>
      </form>
    </SectionFocusProvider>
  );
}
