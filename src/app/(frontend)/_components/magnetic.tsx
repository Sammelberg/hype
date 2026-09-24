"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import type { ReactNode } from "react";

// Pulls its child a little towards the pointer and springs back on leave. Mouse only; touch,
// keyboard and reduced motion get the child unchanged.
export function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const reduce = useReducedMotion();
  const spring = { stiffness: 200, damping: 15, mass: 0.4 };
  const x = useSpring(useMotionValue(0), spring);
  const y = useSpring(useMotionValue(0), spring);
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0)`;

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * strength);
    y.set((event.clientY - rect.top - rect.height / 2) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  // The static outer zone measures the pointer; only the inner layer moves.
  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="-m-fib-md inline-block p-fib-md"
    >
      <motion.div style={{ transform }}>{children}</motion.div>
    </div>
  );
}
