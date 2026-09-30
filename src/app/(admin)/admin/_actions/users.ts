"use server";

import { z } from "zod";

import { ROLES } from "@/cms/auth/roles";
import { destroyAllSessions } from "@/cms/auth/session";
import { temporaryPassword } from "@/cms/auth/temporary-password";
import {
  AuthError,
  createUser,
  deleteUser,
  setPassword,
  setUserRole,
  unlockUser,
} from "@/cms/auth/users";
import { adminActionClient } from "./client";

const id = z.object({ id: z.number().int().positive() });
const role = z.enum(ROLES);

export const createUserAction = adminActionClient
  .inputSchema(
    z.object({
      name: z.string().trim().max(200).nullable(),
      email: z.string().trim().min(1),
      role,
    }),
  )
  .action(async ({ parsedInput }) => {
    const password = temporaryPassword();
    const user = await createUser({ ...parsedInput, password, mustChangePassword: true });
    return { id: user.id, password };
  });

export const resetUserPasswordAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    const password = temporaryPassword();
    await setPassword(parsedInput.id, password, { mustChange: true });
    return { password };
  });

// Not the own role: an admin who made themselves an editor could not undo it.
export const setUserRoleAction = adminActionClient
  .inputSchema(id.extend({ role }))
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.id === ctx.user.id)
      throw new AuthError("Die eigene Rolle ändert ein anderer Admin.");
    await setUserRole(parsedInput.id, parsedInput.role);
  });

export const unlockUserAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    await unlockUser(parsedInput.id);
  });

// Ends every session of the account: a lost laptop, a colleague who left. The password stays.
export const signOutEverywhereAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    await destroyAllSessions(parsedInput.id);
  });

export const deleteUserAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.id === ctx.user.id)
      throw new AuthError("Den eigenen Zugang löschen Sie nicht von hier aus.");
    await deleteUser(parsedInput.id);
  });
