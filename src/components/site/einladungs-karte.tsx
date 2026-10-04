import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// The site's one signature form („Einladungskarte“, CLAUDE.md → Design direction): a card on
// Flieder with a dashed inner frame, the shape of an invitation and its reply slip. It holds what
// leads to a booking — price, date, the button. `data-buchen-ziel` tells the phone's booking bar
// that this page shows its own button, so the bar waits until the card has left the screen.
export function EinladungsKarte({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-buchen-ziel=""
      className={cn("rounded-3xl bg-secondary p-2 shadow-lg", className)}
      {...props}
    >
      <div className="rounded-2xl border-2 border-dashed border-foreground/20 p-6">{children}</div>
    </div>
  );
}

// The fold between invitation and reply slip: a dashed line across the card's inner frame.
export function Abriss({ className, children }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "-mx-6 mt-5 border-t-2 border-dashed border-foreground/20 px-6 pt-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
