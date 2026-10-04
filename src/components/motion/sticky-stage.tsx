import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

// A stage that holds the screen while the page scrolls on, in plain CSS: the holder is a screen
// plus `length` tall and the stage sticks inside it, so the browser keeps it in place on the
// compositor. Its scene (scrollScene) takes the holder (`[data-sticky-stage]`) as trigger with
// the default "top top" → "bottom bottom". With reduced motion it is an ordinary section.
export function StickyStage({
  length,
  children,
  className,
  stageClassName,
}: {
  // CSS length of the scroll the scene plays over, e.g. "200svh".
  length: string;
  children: ReactNode;
  className?: string;
  stageClassName?: string;
}) {
  return (
    <div
      data-sticky-stage
      style={{ "--stage-length": length } as CSSProperties}
      className={cn(
        "relative h-[calc(100svh+var(--stage-length))] motion-reduce:h-auto",
        className,
      )}
    >
      <div
        className={cn(
          "sticky top-0 h-svh overflow-hidden motion-reduce:static motion-reduce:h-auto",
          stageClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
