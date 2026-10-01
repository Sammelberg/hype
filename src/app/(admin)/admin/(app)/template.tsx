"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Changing section, the new screen settles in from a few pixels below — the sidebar's glide
// and this are the whole of the navigation's motion. Documents within a section open in place
// (the template keys on the section, not the document).
export default function AdminTemplate({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="flex flex-1 flex-col gap-4"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
