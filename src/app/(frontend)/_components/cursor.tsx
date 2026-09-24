"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { cn } from "cn";
import { useEffect, useState } from "react";

// A follower for mouse users. The native cursor stays; this adds a small inverting dot that
// grows into a labelled disc over anything marked `data-cursor="<Label>"` (e.g. project covers).
// Touch devices never get it (pointer-fine), and it is hidden from assistive technology.
export function Cursor() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const spring = { stiffness: 500, damping: 40, mass: 0.5 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  const transform = useMotionTemplate`translate3d(${reduce ? x : sx}px, ${reduce ? y : sy}px, 0) translate(-50%, -50%)`;
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-cursor]");
      setLabel(target?.dataset.cursor ?? null);
    };
    const onLeave = () => setVisible(false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      style={{ transform }}
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-50 hidden pointer-fine:block",
        !label && "mix-blend-difference",
      )}
    >
      <div
        data-label={label ? "" : undefined}
        data-visible={visible ? "" : undefined}
        className="grid size-24 scale-[0.125] place-items-center rounded-full bg-white opacity-0 transition-[scale,opacity,background-color] duration-300 ease-(--ease-out) data-label:scale-100 data-label:bg-foreground data-visible:opacity-100"
      >
        <span className="text-sm font-medium text-background opacity-0 transition-opacity duration-200 in-data-label:opacity-100">
          {label}
        </span>
      </div>
    </motion.div>
  );
}
