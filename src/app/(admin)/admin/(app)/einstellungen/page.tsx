import type { Metadata } from "next";

import { requireUser } from "@/cms/auth/guard";
import { emptySiteSettings, getSiteSettingsForEditing } from "@/cms/content/site-settings";
import { listVersions } from "@/cms/content/versions";
import { SettingsEditor } from "./_components/settings-editor";

export const metadata: Metadata = { title: "Website" };

export default async function SettingsPage() {
  await requireUser();
  const [found, versions] = await Promise.all([
    getSiteSettingsForEditing(),
    listVersions("site_settings", 1),
  ]);
  const editing = found?.editing ?? emptySiteSettings();
  return (
    <SettingsEditor
      key={`${found?.updatedAt.getTime() ?? 0}-${found?.hasDraft ?? false}`}
      editing={editing}
      hasDraft={found?.hasDraft ?? false}
      versions={versions}
    />
  );
}
