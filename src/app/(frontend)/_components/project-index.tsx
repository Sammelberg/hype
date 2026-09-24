"use client";

import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

export type IndexItem = {
  href: string;
  title: string;
  meta: string;
  year: number;
  cover: string | null;
  tags: string[];
};

// Every project as a row, filterable by topic. With a mouse, the hovered project's cover follows
// the pointer on a spring and the other rows step back. Touch and keyboard get a plain list.
export function ProjectIndex({ items, topics }: { items: IndexItem[]; topics: string[] }) {
  const area = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const shown = topic ? items.filter((item) => item.tags.includes(topic)) : items;
  const activeItem = items.find((item) => item.href === active);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 350, damping: 35, mass: 0.6 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  const transform = useMotionTemplate`translate3d(${reduce ? x : sx}px, ${reduce ? y : sy}px, 0) translate(-50%, -50%)`;

  const onMove = (event: React.PointerEvent) => {
    const rect = area.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  };

  const onEnter = (event: React.PointerEvent, href: string) => {
    onMove(event);
    // Coming from outside the list: appear at the pointer instead of flying in from the last spot.
    if (active === null) {
      sx.jump(x.get());
      sy.jump(y.get());
    }
    setActive(href);
  };

  const chip =
    "rounded-full border px-4 py-2 text-sm transition-[background-color,color,border-color,scale] duration-150 ease-(--ease-out) outline-offset-2 select-none active:scale-[0.97] hover:border-foreground/40 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background";

  return (
    <div>
      <div className="mb-fib-lg flex flex-wrap items-center justify-between gap-fib-md">
        {topics.length > 1 ? (
          <div role="group" aria-label="Nach Thema filtern" className="flex flex-wrap gap-fib-xs">
            <button
              type="button"
              aria-pressed={topic === null}
              onClick={() => setTopic(null)}
              className={chip}
            >
              Alle
            </button>
            {topics.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={topic === t}
                onClick={() => setTopic(topic === t ? null : t)}
                className={chip}
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}
        <p
          aria-live="polite"
          className="text-sm whitespace-nowrap text-muted-foreground tabular-nums"
        >
          {shown.length} {shown.length === 1 ? "Projekt" : "Projekte"}
          {topic ? <span className="sr-only"> zum Thema {topic}</span> : null}
        </p>
      </div>
      <div
        ref={area}
        className="relative"
        onPointerMove={onMove}
        onPointerLeave={() => setActive(null)}
      >
        <ul className="group/index border-t">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((item) => (
              <motion.li
                key={item.href}
                layout={!reduce}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="border-b"
              >
                <Link
                  href={item.href as never}
                  onPointerEnter={(event) => onEnter(event, item.href)}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-x-fib-md gap-y-1 py-fib-md outline-offset-4 transition-opacity duration-200 ease-(--ease-out) sm:grid-cols-[minmax(0,1.618fr)_minmax(0,1fr)_auto] pointer-fine:group-hover/index:opacity-35 pointer-fine:hover:opacity-100!"
                >
                  <span className="col-start-1 row-start-1 text-2xl font-medium tracking-tight text-balance sm:text-4xl">
                    {item.title}
                  </span>
                  <span className="col-span-2 col-start-1 row-start-2 text-sm text-muted-foreground sm:col-span-1 sm:col-start-2 sm:row-start-1">
                    {item.meta}
                  </span>
                  <span className="col-start-2 row-start-1 text-right text-sm text-muted-foreground tabular-nums sm:col-start-3">
                    {item.year}
                  </span>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <motion.div
          aria-hidden
          style={{ transform }}
          className="pointer-events-none absolute top-0 left-0 z-10 hidden pointer-fine:block"
        >
          <div
            data-visible={activeItem?.cover ? "" : undefined}
            className="relative aspect-golden w-[clamp(16rem,24vw,24rem)] scale-90 overflow-hidden rounded-lg opacity-0 shadow-2xl transition-[opacity,scale] duration-200 ease-(--ease-out) data-visible:scale-100 data-visible:opacity-100 motion-reduce:scale-100"
          >
            {items.map((item) =>
              item.cover ? (
                <Image
                  key={item.href}
                  src={item.cover}
                  alt=""
                  fill
                  sizes="24rem"
                  className={`object-cover transition-opacity duration-200 ${active === item.href ? "opacity-100" : "opacity-0"}`}
                />
              ) : null,
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
