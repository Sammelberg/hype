"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import type { ReactNode } from "react";

// Tilts toward the mouse like a print picked up to the light; a soft sheen follows the pointer.
// Mouse only. Reduced motion keeps it flat. The children (the cover) are not touched, so GSAP can
// keep driving the cover's parallax inside.
const MAX_TILT = 6; // degrees

export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rx = useSpring(useMotionValue(0), spring);
  const ry = useSpring(useMotionValue(0), spring);
  const px = useMotionValue(50);
  const py = useMotionValue(50);
  const glare = useMotionValue(0);
  const transform = useMotionTemplate`perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  const background = useMotionTemplate`radial-gradient(40rem circle at ${px}% ${py}%, rgb(255 255 255 / 0.22), transparent 45%)`;

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    ry.set((nx - 0.5) * 2 * MAX_TILT);
    rx.set((0.5 - ny) * 2 * MAX_TILT);
    px.set(nx * 100);
    py.set(ny * 100);
    glare.set(1);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    glare.set(0);
  };

  return (
    <motion.div
      style={{ transform }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={className}
    >
      {children}
      <motion.div
        aria-hidden
        style={{ background, opacity: glare }}
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-(--ease-out)"
      />
    </motion.div>
  );
}
