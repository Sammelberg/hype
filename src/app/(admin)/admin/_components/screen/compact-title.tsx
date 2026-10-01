"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { ScrollProgress } from "./scroll-progress";

// Once the screen's heading has scrolled away, a slim bar slides in at the top with the title
// again and the reading progress — the large header condenses into it. Decoration for sighted
// users only: the real heading stays where it is.
export function CompactTitle({ title, children }: { title: ReactNode; children: ReactNode }) {
  const reduce = useReducedMotion();
  const anchor = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setAway(!entry!.isIntersecting), {
      rootMargin: "-56px 0px 0px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="sticky top-0 z-20 -mb-8 h-0">
        <AnimatePresence>
          {away ? (
            <motion.div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 -mx-4 flex h-12 items-center border-b bg-background/80 px-4 backdrop-blur-md sm:-mx-6 sm:px-6"
              initial={reduce ? { opacity: 0 } : { y: "-100%" }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: "-100%" }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="truncate text-sm font-semibold tracking-tight">{title}</span>
              <ScrollProgress />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div ref={anchor}>{children}</div>
    </>
  );
}
