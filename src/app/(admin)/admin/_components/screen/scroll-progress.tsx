"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

import { cn } from "@/lib/utils";

// A hairline of ice along the bottom of a sticky bar that fills as the screen is read through:
// where in a long list or editor one is. Follows the scroll directly with reduced motion.
export function ScrollProgress({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 400, damping: 50, restDelta: 0.001 });
  return (
    <motion.span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-primary-soft",
        className,
      )}
      style={{ scaleX: reduce ? scrollYProgress : smooth }}
    />
  );
}
