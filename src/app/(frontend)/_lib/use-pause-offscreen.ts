import { useEffect, useRef } from "react";

// Endless CSS animations (a spinning globe, a blinking caret) keep running when scrolled away.
// This marks the element with `data-offscreen` while it is out of view; globals.css pauses every
// animation on it and inside it.
export function usePauseOffscreen<T extends Element>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      el.toggleAttribute("data-offscreen", !entry?.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
