"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type ElementType,
  useEffect,
  useRef,
} from "react";

// „Arrives once“: the element rises into place the first time it enters the screen, played by a
// CSS transition (globals.css, [data-reveal]); the script only sets data-revealed. One
// IntersectionObserver serves every <Reveal> on the page, so nothing runs per frame. Hidden only
// where scripts run and motion is allowed (@media (scripting: enabled)): without them, and before
// they load, the content stands as it is. Not for a page's h1 or the first screen: those stand
// from the first paint.
let observer: IntersectionObserver | undefined;

function watch(el: Element) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-revealed", "");
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  observer.observe(el);
  return () => observer?.unobserve(el);
}

type RevealProps<T extends ElementType> = {
  as?: T;
  // Position in a row of reveals: each further one starts 80 ms later.
  order?: number;
} & Omit<ComponentProps<T>, "as">;

export function Reveal<T extends ElementType = "div">({
  as,
  order,
  style,
  ...props
}: RevealProps<T>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return watch(ref.current);
  }, []);
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      ref={ref}
      data-reveal=""
      style={order ? ({ ...style, "--reveal-order": order } as CSSProperties) : style}
      {...props}
    />
  );
}
