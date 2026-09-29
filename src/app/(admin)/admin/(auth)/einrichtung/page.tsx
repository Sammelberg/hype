import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { countUsers } from "@/cms/auth/users";
import { getSiteSettings } from "@/cms/content/site-settings";
import { AuthCard } from "../../_components/auth-card";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "Einrichtung" };

// Shown once: while no account exists. Afterwards this address is a 404, not a door.
export default async function SetupPage() {
  if ((await countUsers()) > 0) notFound();
  const settings = await getSiteSettings();
  return (
    <AuthCard
      title="Ersten Zugang anlegen"
      lead="Noch niemand kann sich anmelden. Legen Sie den ersten Zugang an; weitere Zugänge entstehen später unter „Benutzer“."
      siteName={settings?.siteName ?? "Website"}
    >
      <SetupForm />
    </AuthCard>
  );
}
