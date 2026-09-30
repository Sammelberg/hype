"use server";

import { z } from "zod";

import { audited } from "@/cms/audit/log";
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
  .action(async ({ parsedInput, ctx }) => {
    const password = temporaryPassword();
    const user = await audited(
      (tx) => createUser({ ...parsedInput, password, mustChangePassword: true }, tx),
      (u) => ({
        actor: ctx.user,
        action: "zugang.angelegt",
        target: { type: "zugang", id: u.id },
        details: { email: u.email, rolle: u.role },
      }),
    );
    return { id: user.id, password };
  });

export const resetUserPasswordAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => {
    const password = temporaryPassword();
    await audited((tx) => setPassword(parsedInput.id, password, { mustChange: true }, tx), {
      actor: ctx.user,
      action: "zugang.passwort-vergeben",
      target: { type: "zugang", id: parsedInput.id },
    });
    return { password };
  });

// Not the own role: an admin who made themselves an editor could not undo it.
export const setUserRoleAction = adminActionClient
  .inputSchema(id.extend({ role }))
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.id === ctx.user.id)
      throw new AuthError("Die eigene Rolle ändert ein anderer Admin.");
    await audited((tx) => setUserRole(parsedInput.id, parsedInput.role, tx), {
      actor: ctx.user,
      action: "zugang.rolle",
      target: { type: "zugang", id: parsedInput.id },
      details: { rolle: parsedInput.role },
    });
  });

export const unlockUserAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => {
    await audited((tx) => unlockUser(parsedInput.id, tx), {
      actor: ctx.user,
      action: "zugang.entsperrt",
      target: { type: "zugang", id: parsedInput.id },
    });
  });

// Ends every session of the account: a lost laptop, a colleague who left. The password stays.
export const signOutEverywhereAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => {
    await audited((tx) => destroyAllSessions(parsedInput.id, tx), {
      actor: ctx.user,
      action: "zugang.abgemeldet",
      target: { type: "zugang", id: parsedInput.id },
    });
  });

export const deleteUserAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.id === ctx.user.id)
      throw new AuthError("Den eigenen Zugang löschen Sie nicht von hier aus.");
    await audited((tx) => deleteUser(parsedInput.id, {}, tx), {
      actor: ctx.user,
      action: "zugang.geloescht",
      target: { type: "zugang", id: parsedInput.id },
    });
  });
