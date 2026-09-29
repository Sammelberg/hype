"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Inside the admin's preview iframe: the editor posts `cms:refresh` after every save, and the
// page re-renders with the new draft. Same origin only.
export const REFRESH_MESSAGE = "cms:refresh";

export function RefreshOnSave() {
  const router = useRouter();
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string } | null)?.type === REFRESH_MESSAGE) router.refresh();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);
  return null;
}
