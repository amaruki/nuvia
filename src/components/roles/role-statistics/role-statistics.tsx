/**
 * Role Statistics
 *
 * Dashboard component showing role distribution, user counts,
 * and analytics for the role management system.
 */

"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { CategoryBreakdownCard } from "./category-breakdown-card";
import { OverviewCards } from "./overview-cards";
import { RoleDetailsCard } from "./role-details-card";
import { RoleDistributionCard } from "./role-distribution-card";
import type { RoleStatisticsProps } from "./types";

export function RoleStatistics({ data, loading = false }: RoleStatisticsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>No statistics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <OverviewCards data={data} />

      {/* Role Distribution List */}
      <RoleDistributionCard data={data} />

      {/* Category Breakdown */}
      <CategoryBreakdownCard data={data} />

      {/* Role Details Table */}
      <RoleDetailsCard data={data} />
    </div>
  );
}
