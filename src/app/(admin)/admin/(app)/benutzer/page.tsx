import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";
import { listUsers } from "@/cms/auth/users";
import { PageShell } from "../../_components/page-shell";
import { UsersManager } from "./_components/users-manager";

export const metadata: Metadata = { title: "Benutzer" };

export default async function UsersPage() {
  const user = await requireUser();
  const users = await listUsers();
  return (
    <PageShell
      title="Benutzer"
      lead="Wer sich hier anmelden darf. Passwörter werden nie per E-Mail verschickt: Sie vergeben ein vorläufiges und geben es persönlich weiter."
    >
      <UsersManager users={users} currentUserId={user.id} />
    </PageShell>
  );
}
