"use client";

import type { WorkspacesOverviewCardsProps } from "./types";
import {
  TaskCompletionCard,
  TotalDocumentsCard,
  TotalMembersCard,
  TotalWorkspacesCard,
} from "./stat-cards";
import { WorkspaceHealthCard } from "./workspace-health-card";
import { TopActiveWorkspacesCard } from "./top-active-workspaces-card";
import { WorkspaceTypesCard } from "./workspace-types-card";
import { DiscussionsCard, MeetingsCard, TasksCard } from "./additional-metric-cards";

export function WorkspacesOverviewCards({ statistics }: WorkspacesOverviewCardsProps) {
  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <TotalWorkspacesCard statistics={statistics} />
        <TotalMembersCard statistics={statistics} />
        <TotalDocumentsCard statistics={statistics} />
        <TaskCompletionCard statistics={statistics} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Workspace Status Breakdown */}
        <WorkspaceHealthCard statistics={statistics} />

        {/* Top Active Workspaces */}
        <TopActiveWorkspacesCard statistics={statistics} />

        {/* Workspace Type Breakdown */}
        <WorkspaceTypesCard statistics={statistics} />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <DiscussionsCard statistics={statistics} />
        <MeetingsCard statistics={statistics} />
        <TasksCard statistics={statistics} />
      </div>
    </div>
  );
}
