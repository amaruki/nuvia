"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { DEMO_MEMBERS } from "./demo-members";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CHAPTER_COLORS: Record<string, string> = {
  Jakarta: "var(--chart-1)",
  Bandung: "var(--chart-2)",
  Surabaya: "var(--chart-3)",
  Yogyakarta: "var(--chart-4)",
  Denpasar: "var(--chart-5)",
};

function MonthlyJoinsChart() {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of DEMO_MEMBERS) {
      const key = `${member.joinedAt.getFullYear()}-${String(member.joinedAt.getMonth() + 1).padStart(2, "0")}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, joined]) => {
        const [year, month] = key.split("-");
        return {
          month: `${MONTH_LABELS[Number(month) - 1]} ${year}`,
          joined,
        };
      });
  }, []);

  const config: ChartConfig = {
    joined: { label: "Members joined", color: "var(--chart-1)" },
  };

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
        <Bar dataKey="joined" fill="var(--color-joined)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

function ChapterDonutChart() {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of DEMO_MEMBERS) {
      counts.set(member.chapter, (counts.get(member.chapter) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([chapter, count]) => ({ chapter, count }));
  }, []);

  const total = DEMO_MEMBERS.length;

  const config: ChartConfig = Object.fromEntries(
    data.map(({ chapter }) => [
      chapter,
      { label: chapter, color: CHAPTER_COLORS[chapter] ?? "var(--chart-1)" },
    ]),
  );

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <ChartContainer config={config} className="h-[220px] w-full max-w-[260px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
          <Pie data={data} dataKey="count" nameKey="chapter" innerRadius={58} strokeWidth={4}>
            {data.map((entry) => (
              <Cell key={entry.chapter} fill={CHAPTER_COLORS[entry.chapter]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="space-y-2 text-sm">
        {data.map((entry) => (
          <div key={entry.chapter} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: CHAPTER_COLORS[entry.chapter] }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{entry.chapter}</span>
            <span className="tabular-nums font-medium">{entry.count}</span>
          </div>
        ))}
        <p className="text-muted-foreground pt-1 text-xs">
          {total} members across {data.length} chapters
        </p>
      </div>
    </div>
  );
}

export function ChartDemo() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Members joined per month (bar)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyJoinsChart />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Members per chapter (donut)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChapterDonutChart />
        </CardContent>
      </Card>
    </div>
  );
}
