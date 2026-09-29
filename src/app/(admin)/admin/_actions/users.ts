"use server";

import { randomBytes } from "node:crypto";

import { z } from "zod";

import { createUser, deleteUser, setPassword, updateUserName } from "@/cms/auth/users";
import { authActionClient } from "./client";

const id = z.object({ id: z.number().int().positive() });

// A temporary password the admin passes on; the new account must replace it at first sign-in.
const temporaryPassword = () => {
  const words = [
    "tanne",
    "moos",
    "fels",
    "quelle",
    "nebel",
    "wipfel",
    "harz",
    "pfad",
    "hang",
    "bach",
  ];
  const pick = () => words[randomBytes(1)[0]! % words.length];
  return `${pick()}-${pick()}-${pick()}-${randomBytes(2).toString("hex")}`;
};

export const createUserAction = authActionClient
  .inputSchema(
    z.object({ name: z.string().trim().max(200).nullable(), email: z.string().trim().min(1) }),
  )
  .action(async ({ parsedInput }) => {
    const password = temporaryPassword();
    const user = await createUser({ ...parsedInput, password, mustChangePassword: true });
    return { id: user.id, password };
  });

export const resetUserPasswordAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    const password = temporaryPassword();
    await setPassword(parsedInput.id, password, { mustChange: true });
    return { password };
  });

export const renameUserAction = authActionClient
  .inputSchema(id.extend({ name: z.string().trim().max(200).nullable() }))
  .action(async ({ parsedInput }) => {
    await updateUserName(parsedInput.id, parsedInput.name);
  });

export const deleteUserAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.id === ctx.user.id)
      throw new Error("Den eigenen Zugang löschen Sie nicht von hier aus.");
    await deleteUser(parsedInput.id);
  });
