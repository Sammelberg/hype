"use client";

import { motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { ArrowUp } from "lucide-react";
import { useState } from "react";

import { scrollToTop } from "@/lib/smooth-scroll";

// Fixed button in the corner: its ring shows how far down the page you are, and it takes you
// back to the top. It appears after the first screen and stays out of the tab order until then.
export function ScrollProgressTop() {
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  const [shown, setShown] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setShown(y > window.innerHeight));

  return (
    <button
      type="button"
      aria-label="Nach oben"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown || undefined}
      onClick={scrollToTop}
      data-shown={shown ? "" : undefined}
      className="pointer-events-none fixed right-[max(1.25rem,env(safe-area-inset-right))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 grid size-14 translate-y-4 place-items-center rounded-full bg-background/80 opacity-0 shadow-lg outline-offset-4 backdrop-blur-md transition-[opacity,translate,scale] duration-200 ease-(--ease-out) active:scale-[0.97] data-shown:pointer-events-auto data-shown:translate-y-0 data-shown:opacity-100 motion-reduce:translate-y-0"
    >
      <svg aria-hidden viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r="26" fill="none" strokeWidth="1.5" className="stroke-border" />
        <motion.circle
          cx="28"
          cy="28"
          r="26"
          fill="none"
          strokeWidth="1.5"
          className="stroke-primary"
          style={{ pathLength: progress }}
        />
      </svg>
      <ArrowUp aria-hidden className="size-5" />
    </button>
  );
}
