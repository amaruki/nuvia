"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface TrendChartProps {
  /** Buckets pre-ordered oldest first; empty buckets are real zeros, not gaps. */
  data: TrendPoint[];
  /** Series name shown in the tooltip, e.g. "Signups". */
  valueLabel: string;
  /** Chart color; defaults to the theme's first --chart-* token. */
  color?: string;
}

/** Time-series area chart themed through the --chart-* CSS tokens. */
export function TrendChart({ data, valueLabel, color = "var(--chart-1)" }: TrendChartProps) {
  const config: ChartConfig = { value: { label: valueLabel, color } };

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="value"
          type="monotone"
          fill="var(--color-value)"
          stroke="var(--color-value)"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
