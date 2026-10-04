"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  FOCUS_MESSAGE,
  type FocusMessage,
  READY_MESSAGE,
  REFRESH_MESSAGE,
} from "./preview-messages";
import { cn } from "@/lib/utils";

// Inside the admin's preview iframe (draft mode only). The editor posts `cms:refresh` after every
// save, and the page re-renders with the new draft; it posts `cms:focus` when a section of the
// form is being edited, and the page scrolls to that part (`data-cms-zone`) and outlines it, so
// the editor always sees which part of the page the fields change. Same origin only.

type Focus = { zone: string; label: string };
type Box = { top: number; left: number; width: number; height: number } | "missing";

const zoneElement = (zone: string) =>
  document.querySelector<HTMLElement>(`[data-cms-zone="${CSS.escape(zone)}"]`);

function scrollToZone(zone: string) {
  const element = zoneElement(zone);
  if (!element) return;
  const header = zoneElement("kopfleiste");
  // Room above the part for its label, below the sticky header.
  const offset = zone === "kopfleiste" ? 0 : (header?.offsetHeight ?? 0) + 48;
  const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY - offset);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({
    top: zone === "kopfleiste" || zone === "kopf" ? 0 : top,
    behavior: reduced ? "instant" : "smooth",
  });
}

export function PreviewBridge() {
  const router = useRouter();
  const [focus, setFocus] = useState<Focus | null>(null);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string } | null;
      if (data?.type === REFRESH_MESSAGE) router.refresh();
      if (data?.type === FOCUS_MESSAGE) {
        const { zone, label } = data as FocusMessage;
        if (!zone) return setFocus(null);
        setFocus({ zone, label: label ?? zone });
        scrollToZone(zone);
      }
    };
    window.addEventListener("message", onMessage);
    if (window.parent !== window)
      window.parent.postMessage({ type: READY_MESSAGE }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  // Follow the zone while it is focused: it moves with scrolling, and a refresh replaces it.
  useEffect(() => {
    if (!focus) return;
    let frame = 0;
    const measure = () => {
      const element = zoneElement(focus.zone);
      if (!element) setBox("missing");
      else {
        const r = element.getBoundingClientRect();
        setBox((prev) =>
          prev !== "missing" &&
          prev &&
          prev.top === r.top &&
          prev.left === r.left &&
          prev.width === r.width &&
          prev.height === r.height
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height },
        );
      }
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(frame);
      setBox(null);
    };
  }, [focus]);

  if (!focus || !box) return null;
  if (box === "missing")
    return (
      <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
        <p className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-lg">
          {focus.label}: auf dieser Seite gerade nicht sichtbar
        </p>
      </div>
    );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-50 rounded-md outline-2 outline-offset-2 outline-primary-soft"
      style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
    >
      {/* Above the outline when there is room, so it never covers the part's own heading. */}
      <span
        className={cn(
          "absolute rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-md",
          box.top > 72 ? "-top-8 left-0" : "top-2 left-2",
        )}
      >
        {focus.label}
      </span>
    </div>
  );
}
