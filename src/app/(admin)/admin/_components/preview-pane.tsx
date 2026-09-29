"use client";

import { ExternalLinkIcon, MonitorIcon, SmartphoneIcon } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { REFRESH_MESSAGE } from "@/components/site/refresh-on-save";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type PreviewHandle = { refresh: () => void };

// The page as it would look once published, in draft mode inside an iframe of the site.
// After every save the editor calls refresh(); the site listens for the message.
export const PreviewPane = forwardRef<PreviewHandle, { path: string; className?: string }>(
  function PreviewPane({ path, className }, ref) {
    const frame = useRef<HTMLIFrameElement>(null);
    const [width, setWidth] = useState<"desktop" | "phone">("desktop");
    useImperativeHandle(ref, () => ({
      refresh: () =>
        frame.current?.contentWindow?.postMessage(
          { type: REFRESH_MESSAGE },
          window.location.origin,
        ),
    }));
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
