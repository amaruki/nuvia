"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface PriceDistributionDatum {
  /** Formatted price label, e.g. "$25.00". */
  label: string;
  eventCount: number;
}

const config: ChartConfig = {
  eventCount: { label: "Events", color: "var(--chart-1)" },
};

/** How many events list at each price point. Data comes from the server. */
export function PriceDistributionChart({ data }: { data: PriceDistributionDatum[] }) {
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
        <Bar dataKey="eventCount" fill="var(--color-eventCount)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
