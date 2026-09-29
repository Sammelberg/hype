"use client";

import NumberFlow from "@number-flow/react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// One number that matters, counting up on arrival, with the way to the place it comes from.
export function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: number;
  hint?: string;
  href: string;
  icon: LucideIcon;
  index?: number;
}) {
  return (
    <Link
      href={href as never}
      className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        size="sm"
        className="rise-in h-full transition-[transform,box-shadow] duration-200 ease-(--ease-out-strong) group-hover:-translate-y-0.5 group-hover:shadow-md"
        style={{ "--rise-index": index } as React.CSSProperties}
      >
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Icon className="size-4 text-primary-soft" aria-hidden="true" />
            {label}
          </CardDescription>
          <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums" data-numeric>
            <NumberFlow
              value={value}
              locales="de-DE"
              transformTiming={{ duration: 700, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }}
            />
          </CardTitle>
        </CardHeader>
        {hint ? <CardContent className="text-sm text-muted-foreground">{hint}</CardContent> : null}
      </Card>
    </Link>
  );
}
