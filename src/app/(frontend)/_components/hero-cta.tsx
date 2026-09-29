"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import styles from "./hero-cta.module.css";
import { bindPolarStar } from "./polar-star";

// The hero's call to action: large type, no frame. A mouse hover or keyboard focus raises the
// twinkling pole star under the label (polar-star.ts); a tap on touch simply follows the link.
// The label is the site settings' CTA label; its first letter is set in blackletter.
export function HeroCta({ label }: { label: string }) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const link = linkRef.current;
    const canvas = canvasRef.current;
    if (!link || !canvas) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const star = bindPolarStar(canvas, link, { still });

    const enter = (e: PointerEvent) => e.pointerType === "mouse" && star.set(true);
    const leave = (e: PointerEvent) => e.pointerType === "mouse" && star.set(false);
    const focus = () => link.matches(":focus-visible") && star.set(true);
    const blur = () => star.set(false);
    link.addEventListener("pointerenter", enter);
    link.addEventListener("pointerleave", leave);
    link.addEventListener("focus", focus);
    link.addEventListener("blur", blur);
    // Listening from here on (e2e/hero.spec.ts waits for it before hovering).
    link.setAttribute("data-ready", "");
    return () => {
      link.removeAttribute("data-ready");
      link.removeEventListener("pointerenter", enter);
      link.removeEventListener("pointerleave", leave);
      link.removeEventListener("focus", focus);
      link.removeEventListener("blur", blur);
      star.destroy();
    };
  }, []);

  return (
    <Link ref={linkRef} href="/kontakt" className={styles.cta} data-hero-cta>
      <canvas ref={canvasRef} className={styles.sky} aria-hidden="true" />
      {/* One flex item, so the link is named „Projekt anfragen“, not „P rojekt …“. */}
      <span className={styles.label}>
        <span className={styles.initial}>{label.charAt(0)}</span>
        {label.slice(1)}
      </span>
      <svg className={styles.arrow} viewBox="0 0 28 28" aria-hidden="true">
        <path d="M5 14h17M16 8l6 6-6 6" />
      </svg>
    </Link>
  );
}
