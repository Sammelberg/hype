import type { Metadata } from "next";
import Link from "next/link";

import { getSiteSettings } from "@/cms/content/site-settings";
import { mailStatus } from "@/cms/mail/send";
import { AuthCard } from "../../_components/auth-card";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default async function PasswortVergessenPage({
  searchParams,
}: {
  searchParams: Promise<{ gesendet?: string }>;
}) {
  const [{ gesendet }, settings, status] = await Promise.all([
    searchParams,
    getSiteSettings(),
    mailStatus(),
  ]);
  const siteName = settings?.siteName ?? "Website";
  const back = (
    <Link href={"/admin/login" as never} className="text-sm underline underline-offset-4">
      Zurück zur Anmeldung
    </Link>
  );
  if (gesendet) {
    return (
      <AuthCard
        title="Bitte sehen Sie in Ihr Postfach"
        lead="Wenn zu dieser Adresse ein Zugang gehört, ist ein Link unterwegs. Er gilt eine Stunde und nur einmal."
        siteName={siteName}
      >
        {back}
      </AuthCard>
    );
  }
  if (!status.ready) {
    return (
      <AuthCard
        title="Passwort vergessen"
        lead="Diese Website versendet noch keine E-Mails. Ein Admin kann Ihnen unter „Benutzer“ ein vorläufiges Passwort geben."
        siteName={siteName}
      >
        {back}
      </AuthCard>
    );
  }
  return (
    <AuthCard
      title="Passwort vergessen"
      lead="Geben Sie die Adresse Ihres Zugangs ein. Sie bekommen einen Link, mit dem Sie ein neues Passwort festlegen."
      siteName={siteName}
    >
      <div className="flex flex-col gap-6">
        <RequestForm />
        {back}
      </div>
    </AuthCard>
  );
}
