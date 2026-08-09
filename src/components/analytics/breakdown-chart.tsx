"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface BreakdownSlice {
  /** Stable slice key; binds the slice to its --chart-* color in the config. */
  key: string;
  label: string;
  value: number;
}

export interface BreakdownChartProps {
  data: BreakdownSlice[];
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Donut breakdown; slices cycle through the theme's --chart-* tokens. */
export function BreakdownChart({ data }: BreakdownChartProps) {
  const config: ChartConfig = {};
  data.forEach((slice, index) => {
    config[slice.key] = { label: slice.label, color: CHART_COLORS[index % CHART_COLORS.length] };
  });

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-[320px] w-full">
      <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent hideLabel indicator="dot" nameKey="key" />} />
        <Pie data={data} dataKey="value" nameKey="key" innerRadius="55%" outerRadius="80%">
          {data.map((slice) => (
            <Cell key={slice.key} fill={`var(--color-${slice.key})`} stroke="none" />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" className="flex-wrap" />} />
      </PieChart>
    </ChartContainer>
  );
}
