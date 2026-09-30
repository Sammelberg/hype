"use client";

import { ExternalLinkIcon, MonitorIcon, SmartphoneIcon } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

import {
  FOCUS_MESSAGE,
  type FocusMessage,
  READY_MESSAGE,
  REFRESH_MESSAGE,
} from "@/components/site/preview-messages";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type PreviewHandle = {
  refresh: () => void;
  /** Scrolls the preview to a part of the page (`data-cms-zone`) and outlines it. */
  focus: (zone: string | null, label?: string, again?: boolean) => void;
};

// The page as it would look once published, in draft mode inside an iframe of the site.
// After every save the editor calls refresh(); while a section of the form is edited, focus().
export const PreviewPane = forwardRef<PreviewHandle, { path: string; className?: string }>(
  function PreviewPane({ path, className }, ref) {
    const frame = useRef<HTMLIFrameElement>(null);
    const lastFocus = useRef<FocusMessage | null>(null);
    const [width, setWidth] = useState<"desktop" | "phone">("desktop");
    const post = (message: object) =>
      frame.current?.contentWindow?.postMessage(message, window.location.origin);
    useImperativeHandle(ref, () => ({
      refresh: () => post({ type: REFRESH_MESSAGE }),
      focus: (zone, label, again = false) => {
        const message: FocusMessage = { type: FOCUS_MESSAGE, zone, label };
        if (!again && lastFocus.current?.zone === zone) return;
        lastFocus.current = message;
        post(message);
      },
    }));
    // Each load of the preview announces itself; it gets the section being edited again.
    useEffect(() => {
      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.source !== frame.current?.contentWindow) return;
        if ((event.data as { type?: string } | null)?.type !== READY_MESSAGE) return;
        if (lastFocus.current) post(lastFocus.current);
      };
      window.addEventListener("message", onMessage);
      return () => window.removeEventListener("message", onMessage);
    });
    const src = `/next/preview?path=${encodeURIComponent(path)}`;
    return (
      <section aria-label="Vorschau" className={cn("flex min-h-0 flex-col gap-2", className)}>
        <div className="flex items-center justify-between gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={width}
            onValueChange={(v) => v && setWidth(v as typeof width)}
            aria-label="Breite der Vorschau"
          >
            <ToggleGroupItem value="desktop" aria-label="Breit">
              <MonitorIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="phone" aria-label="Schmal">
              <SmartphoneIcon />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button asChild variant="ghost" size="sm">
            <a href={src} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon data-icon="inline-start" /> Im Tab öffnen
            </a>
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 justify-center overflow-hidden rounded-lg border bg-muted/40 p-2">
          <iframe
            ref={frame}
            src={src}
            title={`Vorschau von ${path}`}
            className={cn(
              "h-full min-h-[70vh] rounded-md border bg-background shadow-sm transition-[width] duration-300 ease-(--ease-out-strong)",
              width === "phone" ? "w-[390px]" : "w-full",
            )}
          />
        </div>
      </section>
    );
  },
);
