"use server";

import { z } from "zod";

import {
  discardSiteSettingsDraft,
  publishSiteSettings,
  restoreSiteSettingsVersion,
  saveSiteSettingsDraft,
} from "@/cms/content/site-settings";
import { audited } from "@/cms/audit/log";
import { SiteSettingsSchema } from "@/cms/content/types";
import { getVersion } from "@/cms/content/versions";
import { revalidateSite } from "@/cms/revalidate";
import { CmsError } from "@/cms/errors";
import { authActionClient } from "./client";

export const saveSettingsDraftAction = authActionClient
  .inputSchema(SiteSettingsSchema)
  .action(async ({ parsedInput }) => {
    await saveSiteSettingsDraft(parsedInput);
    return { savedAt: new Date().toISOString() };
  });

export const publishSettingsAction = authActionClient
  .inputSchema(z.object({ input: SiteSettingsSchema.optional() }))
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.input) await saveSiteSettingsDraft(parsedInput.input);
    await audited((tx) => publishSiteSettings(ctx.user.id, tx), {
      actor: ctx.user,
      action: "website.veroeffentlicht",
    });
    revalidateSite();
  });

export const discardSettingsDraftAction = authActionClient.action(async () => {
  await discardSiteSettingsDraft();
});

export const restoreSettingsVersionAction = authActionClient
  .inputSchema(z.object({ versionId: z.number().int().positive() }))
  .action(async ({ parsedInput, ctx }) => {
    const version = await getVersion(parsedInput.versionId);
    if (!version || version.collection !== "site_settings")
      throw new CmsError("Diese Version gehört nicht zu den Einstellungen.");
    await restoreSiteSettingsVersion(version.snapshot, ctx.user.id);
  });
