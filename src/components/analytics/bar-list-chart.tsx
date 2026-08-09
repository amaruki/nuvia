"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface BarListPoint {
  label: string;
  value: number;
}

export interface BarListChartProps {
  data: BarListPoint[];
  /** Series name shown in the tooltip, e.g. "Items". */
  valueLabel: string;
  /** Chart color; defaults to the theme's second --chart-* token. */
  color?: string;
}

/** Vertical bar chart for small named distributions (types, categories, statuses). */
export function BarListChart({ data, valueLabel, color = "var(--chart-2)" }: BarListChartProps) {
  const config: ChartConfig = { value: { label: valueLabel, color } };

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
