import type { ReactNode } from "react";

import { requireUser } from "@/cms/auth/guard";

// Print views of the office's documents: signed in, no sidebar, a sheet on a quiet background.
export default async function DruckLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <div className="min-h-svh bg-muted/60 print:bg-white">{children}</div>;
}
