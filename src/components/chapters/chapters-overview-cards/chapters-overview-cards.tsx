"use client";

import type { ChaptersOverviewCardsProps } from "./types";
import {
  TotalChaptersCard,
  TotalEventsCard,
  TotalMembersCard,
  TotalRevenueCard,
} from "./stat-cards";
import { ChapterHealthCard } from "./chapter-health-card";
import { TopPerformingChaptersCard } from "./top-performing-card";
import { RegionalBreakdownCard } from "./regional-breakdown-card";

export function ChaptersOverviewCards({ statistics }: ChaptersOverviewCardsProps) {
  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <TotalChaptersCard statistics={statistics} />
        <TotalMembersCard statistics={statistics} />
        <TotalEventsCard statistics={statistics} />
        <TotalRevenueCard statistics={statistics} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Chapter Status Breakdown */}
        <ChapterHealthCard statistics={statistics} />

        {/* Top Performing Chapters */}
        <TopPerformingChaptersCard statistics={statistics} />

        {/* Regional Breakdown */}
        <RegionalBreakdownCard statistics={statistics} />
      </div>
    </div>
  );
}
