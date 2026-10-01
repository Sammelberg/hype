"use client";

import { type ComponentProps, useEffect, useRef } from "react";

/**
 * A div that tells its CSS whether it is on screen (`data-active`), so looping motion inside it
 * (twinkling stars, rising lights) pauses while nobody sees it. Without script it stays active.
 */
export function InView(props: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      el.dataset.active = entry?.isIntersecting ? "true" : "false";
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref} {...props} />;
}
