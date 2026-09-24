"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// A statement that darkens word by word as it scrolls through the viewport. The readable text is
// the muted base layer; a word-split copy on top (aria-hidden) fades in with the scroll.
export function ScrollStatement({ text }: { text: string }) {
  const root = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia(root.current ?? undefined);
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-word]", {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: {
            trigger: root.current,
            start: "top 80%",
            end: "bottom 45%",
            scrub: true,
          },
        });
      });
      // Reduced motion: the statement is simply shown in full contrast.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-word]", { opacity: 1 });
      });
    },
    { scope: root },
  );

  const words = text.split(/\s+/);
  return (
    <p
      ref={root}
      className="relative max-w-6xl text-3xl leading-[1.15] font-semibold tracking-tight text-pretty text-muted-foreground sm:text-5xl lg:text-6xl"
    >
      {text}
      <span aria-hidden className="absolute inset-0 text-foreground">
        {words.map((word, i) => (
          <span key={i} data-word className="opacity-0">
            {word}{" "}
          </span>
        ))}
      </span>
    </p>
  );
}
