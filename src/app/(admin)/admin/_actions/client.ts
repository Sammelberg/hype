import { createSafeActionClient } from "next-safe-action";

import { requireUserForAction } from "@/cms/auth/guard";
import { AuthError } from "@/cms/auth/users";
import { PageError } from "@/cms/content/pages";
import { ProjektError } from "@/cms/content/projekte";
import { RedirectError } from "@/cms/content/redirects";
import { UploadError } from "@/cms/media/store";
import { BueroError } from "@/buero/daten/basis";

// Every admin action: a signed-in user, zod-validated input, known errors as German messages
// (a `field` when one input is to blame), anything else as one generic line.
export type ActionFailure = { message: string; field?: string };

const known = (error: unknown): ActionFailure | null => {
  if (
    error instanceof PageError ||
    error instanceof ProjektError ||
    error instanceof RedirectError ||
    error instanceof AuthError ||
    error instanceof BueroError
  ) {
    return { message: error.message, field: error.field };
  }
  if (error instanceof UploadError) return { message: error.message };
  if (error instanceof Error && error.message === "Bitte melden Sie sich an.")
    return { message: error.message };
  return null;
};

export const actionClient = createSafeActionClient({
  handleServerError(error): ActionFailure {
    const failure = known(error);
    if (failure) return failure;
    console.error("Admin-Aktion fehlgeschlagen", error);
    return { message: "Das hat nicht geklappt. Bitte versuchen Sie es noch einmal." };
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const user = await requireUserForAction();
  return next({ ctx: { user } });
});
