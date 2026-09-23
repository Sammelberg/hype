import "server-only";

import { notFound, permanentRedirect, redirect } from "next/navigation";

import { findRedirect } from "@/lib/queries";

// Use instead of notFound() in routes backed by CMS documents: a redirect from the admin wins.
export async function redirectOrNotFound(path: string): Promise<never> {
  const target = await findRedirect(path);
  // Destinations come from the CMS, so typed routes cannot know them.
  if (target?.permanent) permanentRedirect(target.destination as never);
  if (target) redirect(target.destination as never);
  notFound();
}
