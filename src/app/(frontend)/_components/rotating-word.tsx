"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// One word of the hero headline that changes in turn, rising in from below. Screen readers and
// search get the whole list once (`label`); the moving words are hidden from them. It changes only
// while on screen; with reduced motion it stays on the first word.
export function RotatingWord({
  words,
  label,
  interval = 2600,
  className,
}: {
  words: string[];
  /** The words as one phrase, read instead of the animation. */
  label: string;
  interval?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || !inView) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [reduce, inView, words.length, interval]);

  return (
    // Padding keeps descenders (p, g) clear of the clip; the negative margin keeps the line height.
    <span
      ref={ref}
      className={cn("relative -my-[0.1em] grid overflow-hidden py-[0.1em]", className)}
    >
      <span className="sr-only">{label}</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={words[index]}
          aria-hidden="true"
          className="col-start-1 row-start-1 whitespace-nowrap"
          initial={{ y: "105%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-105%", opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
