"use client";

import { RoleStatistics, RoleStatisticsData } from "@/components/roles/role-statistics";

import { QuickActionsCard } from "./quick-actions-card";
import { RoleHierarchyCard } from "./role-hierarchy-card";

interface OverviewTabProps {
  roleStats: RoleStatisticsData | undefined;
  loading: boolean;
  onNavigate: (tab: string) => void;
}

export function OverviewTab({ roleStats, loading, onNavigate }: OverviewTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <RoleStatistics data={roleStats} loading={loading} />
      </div>
      <div className="space-y-6">
        {/* Quick Stats */}
        <QuickActionsCard onNavigate={onNavigate} />

        {/* Role Hierarchy Info */}
        <RoleHierarchyCard />
      </div>
    </div>
  );
}
