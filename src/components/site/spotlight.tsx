"use client";

import { type ComponentProps, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * A surface lit where the mouse is: a soft ice light follows the pointer (--mx, --my) and fades
 * out when it leaves. Touch and keyboard see the plain surface; the light is decoration only.
 */
export function Spotlight({ className, children, ...props }: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      {...props}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const el = ref.current;
        if (!el) return;
        const box = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - box.left}px`);
        el.style.setProperty("--my", `${e.clientY - box.top}px`);
      }}
      className={cn(
        "relative isolate overflow-clip",
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:opacity-0 before:transition-opacity before:duration-300 before:content-['']",
        "before:bg-[radial-gradient(22rem_circle_at_var(--mx,50%)_var(--my,50%),oklch(0.79_0.085_252/0.12),transparent_70%)]",
        "hover:before:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
