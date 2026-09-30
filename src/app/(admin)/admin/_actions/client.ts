import { createSafeActionClient } from "next-safe-action";

import { NotAllowed, requireUserForAction } from "@/cms/auth/guard";
import { CmsError } from "@/cms/errors";

// Every admin action: a signed-in user, zod-validated input, known errors as German messages
// (a `field` when one input is to blame), anything else as one generic line.
export type ActionFailure = { message: string; field?: string };

const known = (error: unknown): ActionFailure | null =>
  error instanceof CmsError ? { message: error.message, field: error.field } : null;

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

// Accounts, the office, the log: admins only (src/cms/auth/roles.ts).
export const adminActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (ctx.user.role !== "admin") throw new NotAllowed();
  return next({ ctx });
});
