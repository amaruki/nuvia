"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface GrowthDatum {
  /** "YYYY-MM" UTC month bucket, computed server-side. */
  month: string;
  newMembers: number;
}

const config: ChartConfig = {
  newMembers: { label: "New members", color: "var(--chart-1)" },
};

/** New member accounts per month over the trailing twelve months. */
export function GrowthChart({ data }: { data: GrowthDatum[] }) {
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="newMembers" fill="var(--color-newMembers)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
