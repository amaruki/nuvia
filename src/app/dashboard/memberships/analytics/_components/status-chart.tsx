"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface StatusDatum {
  label: string;
  count: number;
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Derived member-status breakdown (ADR-0014 derivation, computed server-side). */
export function StatusChart({ data }: { data: StatusDatum[] }) {
  const config: ChartConfig = Object.fromEntries(
    data.map((entry, index) => [
      entry.label,
      { label: entry.label, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  );

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={4}>
          {data.map((entry, index) => (
            <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
