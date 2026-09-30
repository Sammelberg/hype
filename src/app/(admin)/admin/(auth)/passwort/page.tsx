import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";
import { getSiteSettings } from "@/cms/content/site-settings";
import { AuthCard } from "../../_components/auth-card";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Passwort" };

export default async function PasswordPage() {
  const [user, settings] = await Promise.all([
    requireUser({ next: "/admin/passwort", passwordPage: true }),
    getSiteSettings(),
  ]);
  return (
    <AuthCard
      title={user.mustChangePassword ? "Bitte wählen Sie ein eigenes Passwort" : "Passwort ändern"}
      lead={
        user.mustChangePassword
          ? "Sie haben ein vorläufiges Passwort erhalten. Ersetzen Sie es jetzt durch eines, das nur Sie kennen."
          : "Danach sind Sie auf allen anderen Geräten abgemeldet."
      }
      siteName={settings?.siteName ?? "Website"}
    >
      <PasswordForm forced={user.mustChangePassword} />
    </AuthCard>
  );
}
