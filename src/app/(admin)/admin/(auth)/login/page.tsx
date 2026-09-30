import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/cms/auth/guard";
import { countUsers } from "@/cms/auth/users";
import { getSiteSettings } from "@/cms/content/site-settings";
import { AuthCard } from "../../_components/auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ weiter?: string }>;
}) {
  const [{ weiter }, user, users, settings] = await Promise.all([
    searchParams,
    getSessionUser(),
    countUsers(),
    getSiteSettings(),
  ]);
  if (user) redirect("/admin" as never);
  // No setup page: the first account is created on the server, so an empty database offers
  // nobody a way in.
  if (users === 0) {
    return (
      <AuthCard
        title="Noch kein Zugang"
        lead="Der erste Zugang wird auf dem Server angelegt. Das vorläufige Passwort erscheint dort einmal und wird beim ersten Anmelden ersetzt."
        siteName={settings?.siteName ?? "Website"}
      >
        <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">
          pnpm cms:passwort ihre@adresse.de --anlegen
        </pre>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Anmelden" siteName={settings?.siteName ?? "Website"}>
      <LoginForm next={weiter} />
    </AuthCard>
  );
}
