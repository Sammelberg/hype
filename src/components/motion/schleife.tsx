"use client";

import { type ComponentProps, type RefObject, useEffect, useRef, useState } from "react";

// Whether `ref` is on screen and its tab in front: a loop (canvas, WebGL, requestAnimationFrame)
// draws only while this is true, and only when something changed.
export function useSichtbar(ref: RefObject<Element | null>) {
  const [inView, setInView] = useState(false);
  const [front, setFront] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false));
    io.observe(el);
    const onVisibility = () => setFront(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref]);
  return inView && front;
}

// A loop that rests off screen: CSS animations inside (a running band, breathing, a turning mark)
// pause while it is out of view or the tab is in the background (globals.css, [data-pausiert]).
// The loop itself belongs in CSS keyframes on transform or opacity, under motion-safe.
export function Schleife({ children, ...props }: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const sichtbar = useSichtbar(ref);
  return (
    <div ref={ref} data-pausiert={sichtbar ? undefined : ""} {...props}>
      {children}
    </div>
  );
}
