"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export type MonatsPunkt = { monat: string; umsatz: number; eingang: number };

const MONAT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const kurz = (monat: string) => MONAT[Number(monat.slice(5, 7)) - 1] ?? monat;
const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const config: ChartConfig = {
  umsatz: { label: "Gestellt (netto)", color: "var(--chart-2)" },
  eingang: { label: "Eingegangen", color: "var(--chart-5)" },
};

// Twelve months of money: what was invoiced (net, by issue date) beside what came in.
export function MonatsChart({ data }: { data: MonatsPunkt[] }) {
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data} margin={{ left: 0, right: 4, top: 8 }} barGap={2}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="monat"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={kurz}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => euro.format(v)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(v) => `${kurz(String(v))} ${String(v).slice(0, 4)}`}
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">
                    {config[name as keyof typeof config]?.label}
                  </span>
                  <span className="font-medium tabular-nums">{euro.format(Number(value))}</span>
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="umsatz"
          fill="var(--color-umsatz)"
          radius={[4, 4, 0, 0]}
          animationDuration={600}
        />
        <Bar
          dataKey="eingang"
          fill="var(--color-eingang)"
          radius={[4, 4, 0, 0]}
          animationDuration={600}
        />
      </BarChart>
    </ChartContainer>
  );
}
