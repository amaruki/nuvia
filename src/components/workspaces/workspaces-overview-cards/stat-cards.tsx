import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, FileText, FolderOpen, Users } from "lucide-react";
import type { WorkspaceStatisticsCardProps } from "./types";
import { formatPercentage } from "./helpers";

export function TotalWorkspacesCard({ statistics }: WorkspaceStatisticsCardProps) {
  return (
    <Card className="shadow-sm border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Workspaces</p>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <FolderOpen className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{statistics.totalWorkspaces}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {statistics.activeWorkspaces} active, {statistics.archivedWorkspaces} archived
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TotalMembersCard({ statistics }: WorkspaceStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Members</p>
          <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-success" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{statistics.totalMembers}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {statistics.averageMembersPerWorkspace.toFixed(1)} avg per workspace
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TotalDocumentsCard({ statistics }: WorkspaceStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
            <FileText className="h-4 w-4 text-accent-foreground" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{statistics.totalDocuments}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {formatPercentage(statistics.documentUploadRate)} upload rate
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TaskCompletionCard({ statistics }: WorkspaceStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Task Completion</p>
          <div className="h-8 w-8 rounded-full bg-chart-3/10 flex items-center justify-center">
            <CheckSquare className="h-4 w-4 text-chart-3" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">
            {formatPercentage(statistics.taskCompletionRate)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {statistics.totalTasks} total tasks
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
