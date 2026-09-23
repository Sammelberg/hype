"use client";

import { RefreshRouteOnSave as PayloadRefresh } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";

// Re-renders the page inside the admin's live-preview iframe whenever the document is saved.
export function RefreshOnSave({ serverURL }: { serverURL: string }) {
  const router = useRouter();
  return <PayloadRefresh refresh={() => router.refresh()} serverURL={serverURL} />;
}
