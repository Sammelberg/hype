"use client";

import { useEffect, useRef, useState } from "react";

export type SaveState = {
  status: "idle" | "dirty" | "saving" | "saved" | "error";
  at?: Date;
  message?: string;
};

// Calls `save` a moment after the last change and reports where things stand. The document
// itself never blocks on it: publishing sends the current form values anyway.
export function useAutosave<T>(
  value: T,
  dirty: boolean,
  save: (value: T) => Promise<void>,
  delay = 1500,
) {
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const latest = useRef(value);
  const pending = useRef(false);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => {
    if (!dirty) return;
    pending.current = true;
    const timer = setTimeout(async () => {
      pending.current = false;
      setState({ status: "saving" });
      try {
        await save(latest.current);
        setState({ status: "saved", at: new Date() });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Nicht gespeichert.",
        });
      }
    }, delay);
    // The timer marks unsaved work while it runs (a paint later, not inside the effect body).
    const mark = setTimeout(
      () => setState((s) => (s.status === "saving" ? s : { status: "dirty" })),
      0,
    );
    return () => {
      clearTimeout(timer);
      clearTimeout(mark);
    };
  }, [value, dirty, save, delay]);

  return { state, setState, hasPending: () => pending.current };
}
