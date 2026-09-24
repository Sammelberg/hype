"use client";

import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type Fact = { value: number; label: string };

// Counts computed from the CMS. They roll up from zero once when they scroll into view; the
// server HTML carries the real numbers, so without JS (or above the fold) nothing ever reads 0.
export function FactCounters({ facts }: { facts: Fact[] }) {
  const root = useRef<HTMLDListElement>(null);
  const inView = useInView(root, { once: true, margin: "0px 0px -20% 0px" });
  const [armed, setArmed] = useState(false);

  // Below the fold on mount: reset to zero so the roll-up has somewhere to start from.
  useEffect(() => {
    const rect = root.current?.getBoundingClientRect();
    if (rect && rect.top > window.innerHeight) setArmed(true);
  }, []);

  const show = !armed || inView;
  return (
    <NumberFlowGroup>
      <dl ref={root} className="grid gap-x-grid gap-y-fib-lg border-t pt-fib-lg sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col-reverse gap-2">
            <dt className="text-sm text-muted-foreground">{fact.label}</dt>
            <dd className="text-6xl font-semibold tracking-tighter tabular-nums sm:text-7xl lg:text-8xl">
              <NumberFlow value={show ? fact.value : 0} locales="de-DE" />
            </dd>
          </div>
        ))}
      </dl>
    </NumberFlowGroup>
  );
}
