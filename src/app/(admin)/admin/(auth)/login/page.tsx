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
  if (users === 0) redirect("/admin/einrichtung" as never);
  return (
    <AuthCard title="Anmelden" siteName={settings?.siteName ?? "Website"}>
      <LoginForm next={weiter} />
    </AuthCard>
  );
}
