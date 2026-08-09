"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface TierDatum {
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

/** ACTIVE subscriptions per tier, as a donut with a legend. */
export function TierDistributionChart({ data }: { data: TierDatum[] }) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0);
  const config: ChartConfig = Object.fromEntries(
    data.map((entry, index) => [
      entry.label,
      { label: entry.label, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  );

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <ChartContainer config={config} className="h-[220px] w-full max-w-[260px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
          <Pie data={data} dataKey="count" nameKey="label" innerRadius={58} strokeWidth={4}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="space-y-2 text-sm">
        {data.map((entry, index) => (
          <div key={entry.label} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{entry.label}</span>
            <span className="tabular-nums font-medium">{entry.count}</span>
          </div>
        ))}
        <p className="text-muted-foreground pt-1 text-xs">
          {total} active subscriptions across {data.length} tiers
        </p>
      </div>
    </div>
  );
}
