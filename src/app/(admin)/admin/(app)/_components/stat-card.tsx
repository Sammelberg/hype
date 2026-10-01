"use client";

import NumberFlow from "@number-flow/react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// One number that matters, counting up on arrival, with the way to the place it comes from.
export function StatCard({
  label,
  value,
  hint,
  href,
  icon,
  index = 0,
  euro = false,
  ton,
}: {
  label: string;
  value: number;
  hint?: string;
  href: string;
  /** Rendered by the server page: a function cannot cross into a client component. */
  icon: ReactNode;
  index?: number;
  /** The value is an amount in cents, shown as euros. */
  euro?: boolean;
  /** Colours the number when it asks for attention. */
  ton?: "warnung";
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
            <span className="text-primary-soft [&_svg]:size-4" aria-hidden="true">
              {icon}
            </span>
            {label}
          </CardDescription>
          <CardTitle
            className={`text-3xl font-semibold tracking-tight tabular-nums group-data-[size=sm]/card:text-3xl ${ton === "warnung" && value > 0 ? "text-warning" : ""}`}
            data-numeric
          >
            <NumberFlow
              value={euro ? value / 100 : value}
              locales="de-DE"
              format={
                euro ? { style: "currency", currency: "EUR", maximumFractionDigits: 0 } : undefined
              }
              transformTiming={{ duration: 700, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }}
            />
          </CardTitle>
        </CardHeader>
        {hint ? <CardContent className="text-sm text-muted-foreground">{hint}</CardContent> : null}
      </Card>
    </Link>
  );
}
