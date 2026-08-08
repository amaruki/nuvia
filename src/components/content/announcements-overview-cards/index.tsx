"use client";

import type { AnnouncementsOverviewCardsProps } from "./types";
import { KeyMetricsCards } from "./key-metrics-cards";
import { StatusBreakdownCard } from "./status-breakdown-card";
import { TopPerformingCard } from "./top-performing-card";
import { TypeDistributionCard } from "./type-distribution-card";
import { PriorityDistributionCard } from "./priority-distribution-card";
import { TargetAudienceCard } from "./target-audience-card";

export function AnnouncementsOverviewCards({ statistics }: AnnouncementsOverviewCardsProps) {
  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <KeyMetricsCards statistics={statistics} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Announcement Status Breakdown */}
        <StatusBreakdownCard statistics={statistics} />

        {/* Top Performing Announcements */}
        <TopPerformingCard statistics={statistics} />

        {/* Announcement Types */}
        <TypeDistributionCard statistics={statistics} />

        {/* Priority Distribution */}
        <PriorityDistributionCard statistics={statistics} />

        {/* Target Audience */}
        <TargetAudienceCard statistics={statistics} />
      </div>
    </div>
  );
}
