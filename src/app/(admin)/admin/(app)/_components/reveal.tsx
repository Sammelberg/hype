"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Sections below the fold rise into view once as the page is scrolled — a single, quiet
// entrance per section (30–80 ms stagger inside), none at all with reduced motion.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      className={className}
      initial={reduce ? false : { opacity: 0, transform: "translateY(12px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.section>
  );
}
