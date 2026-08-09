"use client";

import type { PublicationsOverviewCardsProps } from "./types";
import {
  AverageEngagementCard,
  PublishedPublicationsCard,
  TotalPublicationsCard,
  TotalViewsCard,
} from "./stat-cards";
import { PublicationHealthCard } from "./publication-health-card";
import { TopPerformingPublicationsCard } from "./top-performing-card";
import { PublicationTypesCard } from "./publication-types-card";

export function PublicationsOverviewCards({ statistics }: PublicationsOverviewCardsProps) {
  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <TotalPublicationsCard statistics={statistics} />
        <PublishedPublicationsCard statistics={statistics} />
        <TotalViewsCard statistics={statistics} />
        <AverageEngagementCard statistics={statistics} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Publication Status Breakdown */}
        <PublicationHealthCard statistics={statistics} />

        {/* Top Performing Publications */}
        <TopPerformingPublicationsCard statistics={statistics} />

        {/* Publication Types */}
        <PublicationTypesCard statistics={statistics} />
      </div>
    </div>
  );
}
