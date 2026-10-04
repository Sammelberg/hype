import type { Metadata } from "next";
import Link from "next/link";

import { resetValid } from "@/cms/auth/reset";
import { getSiteSettings } from "@/cms/content/site-settings";
import { AuthCard } from "../../../_components/auth-card";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Neues Passwort", referrer: "no-referrer" };

export default async function NeuesPasswortPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [{ token }, settings] = await Promise.all([params, getSiteSettings()]);
  const siteName = settings?.siteName ?? "Website";
  if (!(await resetValid(token))) {
    return (
      <AuthCard
        title="Dieser Link gilt nicht mehr"
        lead="Er ist abgelaufen oder wurde schon benutzt. Fordern Sie einfach einen neuen an."
        siteName={siteName}
      >
        <Link
          href={"/admin/passwort-vergessen" as never}
          className="text-sm underline underline-offset-4"
        >
          Neuen Link anfordern
        </Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard
      title="Neues Passwort"
      lead="Danach sind Sie auf allen anderen Geräten abgemeldet."
      siteName={siteName}
    >
      <NewPasswordForm token={token} />
    </AuthCard>
  );
}
