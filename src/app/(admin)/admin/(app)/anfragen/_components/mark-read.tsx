"use client";

import { useEffect, useRef } from "react";

import { markSubmissionAction } from "../../../_actions/forms";

// Opening a message reads it: an action after the page is shown, never a write during render
// (a GET must not change data, and the page may run before the layout has checked the session).
// Only on opening: once marked unread again by hand, the message stays unread. The action
// revalidates the admin, so the page and the sidebar's count refresh with its answer.
export function MarkRead({ id, unread }: { id: number; unread: boolean }) {
  const unreadOnOpen = useRef(unread);
  useEffect(() => {
    if (!unreadOnOpen.current) return;
    unreadOnOpen.current = false;
    void markSubmissionAction({ id, read: true });
  }, [id]);
  return null;
}
