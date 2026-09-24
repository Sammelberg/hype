"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Showreel card beside the hero title. It starts muted (browsers only autoplay silent video) and
// only for users who allow motion, pauses while off screen, and has its own pause (WCAG 2.2.2)
// and sound controls. Without JS or with reduced motion the poster frame stays.
// A soft vignette darkens the edges; the caption dot pulses while the reel plays.
export function HeroVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const stopped = useRef(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const play = () => {
      if (!stopped.current && motion.matches) el.play().catch(() => {});
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) play();
      else el.pause();
    });
    const onMotionChange = () => (motion.matches ? play() : el.pause());
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    const onVolume = () => setMuted(el.muted);

    observer.observe(el);
    motion.addEventListener("change", onMotionChange);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("volumechange", onVolume);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", onMotionChange);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("volumechange", onVolume);
    };
  }, []);

  const togglePlay = () => {
    const el = video.current;
    if (!el) return;
    stopped.current = !el.paused;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  // Turning the sound on is a request to watch: it also starts a paused video.
  const toggleSound = () => {
    const el = video.current;
    if (!el) return;
    el.muted = !el.muted;
    if (!el.muted && el.paused) {
      stopped.current = false;
      el.play().catch(() => {});
    }
  };

  const control =
    "grid size-11 place-items-center rounded-full border border-foreground/15 bg-background/60 text-foreground backdrop-blur-md transition-[border-color,color,scale] duration-150 ease-(--ease-out) outline-none hover:border-primary hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]";

  return (
    <figure
      className={cn(
        "relative isolate m-0 aspect-video overflow-hidden rounded-3xl border border-foreground/8 bg-card",
        className,
      )}
    >
      <video
        ref={video}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 -z-10 size-full object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0_0_0/45%)),linear-gradient(to_bottom,oklch(0_0_0/35%),transparent_30%)]"
      />
      <figcaption className="absolute top-fib-md left-fib-md flex items-center gap-2 rounded-full bg-background/60 px-3 py-1.5 text-xs font-medium tracking-wide uppercase backdrop-blur-md">
        <span aria-hidden className="relative grid size-1.5 place-items-center">
          {paused ? null : (
            <span className="absolute size-full rounded-full bg-primary motion-safe:animate-ping" />
          )}
          <span className="size-full rounded-full bg-primary" />
        </span>
        Showreel
      </figcaption>
      <div className="absolute top-fib-md right-fib-md flex gap-2">
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Ton einschalten" : "Ton ausschalten"}
          className={control}
        >
          {muted ? (
            <VolumeX aria-hidden className="size-4" />
          ) : (
            <Volume2 aria-hidden className="size-4" />
          )}
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={paused ? "Showreel abspielen" : "Showreel anhalten"}
          className={control}
        >
          {paused ? (
            <Play aria-hidden className="size-4 fill-current" />
          ) : (
            <Pause aria-hidden className="size-4 fill-current" />
          )}
        </button>
      </div>
    </figure>
  );
}
