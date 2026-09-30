"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export type WeeklyPoint = { week: string; count: number };

// Twelve weeks of one count — messages, publications — as bars in the accent colour.
export function WeeklyChart({
  data,
  label,
  color = "var(--chart-1)",
}: {
  data: WeeklyPoint[];
  label: string;
  color?: string;
}) {
  const config: ChartConfig = { count: { label, color } };
  return (
    <ChartContainer config={config} className="h-48 w-full">
      <BarChart data={data} margin={{ left: 0, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v: string) => v.replace(/^\d{4}-/, "")}
          interval={1}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(v) => `Woche ${String(v).replace(/^\d{4}-KW/, "")}`}
            />
          }
        />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={[4, 4, 0, 0]}
          isAnimationActive
          animationDuration={600}
          animationEasing="ease-out"
        />
      </BarChart>
    </ChartContainer>
  );
}
