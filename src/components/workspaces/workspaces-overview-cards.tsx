"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkspaceOverallStatistics } from "@/types/committee.types";
import {
  Users,
  FileText,
  CheckSquare,
  MessageSquare,
  Calendar,
  TrendingUp,
  Activity,
  FolderOpen,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface WorkspacesOverviewCardsProps {
  statistics: WorkspaceOverallStatistics;
}

export function WorkspacesOverviewCards({ statistics }: WorkspacesOverviewCardsProps) {
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-rose-600" />
    );
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? "text-emerald-600" : "text-rose-600";
  };

  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Workspaces */}
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Workspaces</p>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-blue-600" />
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

        {/* Total Members */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Members</p>
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-600" />
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

        {/* Total Documents */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
              <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-purple-600" />
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

        {/* Task Completion Rate */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Task Completion</p>
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{formatPercentage(statistics.taskCompletionRate)}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {statistics.totalTasks} total tasks
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Workspace Status Breakdown */}
        <Card className="shadow-sm col-span-1 lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Workspace Health</CardTitle>
            <CardDescription>Status distribution across all workspaces</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center gap-4">
             {/* Status Item: Active */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <CheckSquare className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Active</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                    {statistics.activeWorkspaces}
                </Badge>
            </div>

            {/* Status Item: Archived */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <FolderOpen className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Archived</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-slate-50 text-slate-700 border-slate-200">
                    {statistics.archivedWorkspaces}
                </Badge>
            </div>

            {/* Status Item: Locked */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                        <Target className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Locked</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-rose-50 text-rose-700 border-rose-200">
                    {statistics.lockedWorkspaces}
                </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Active Workspaces */}
        <Card className="shadow-sm col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Most Active Workspaces
            </CardTitle>
            <CardDescription>By activity score and engagement rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {statistics.topActiveWorkspaces
                .slice(0, 4)
                .map((workspace, index) => {
                  // Calculate percentage for bar width (relative to max activity score in set for visual)
                  const maxScore = Math.max(...statistics.topActiveWorkspaces.map(w => w.activityScore));
                  const percentage = (workspace.activityScore / maxScore) * 100;
                   
                  return (
                  <div key={workspace.workspaceId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                          {workspace.workspaceName}
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                            {workspace.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold block">{workspace.memberCount} members</span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                         <span>Engagement: <span className="font-medium">{formatPercentage(workspace.engagementRate)}</span></span>
                         <span>Activity: <span className="font-medium">{workspace.activityScore.toFixed(1)}</span></span>
                    </div>
                  </div>
                )})}
            </div>
          </CardContent>
        </Card>

        {/* Workspace Type Breakdown */}
        <Card className="shadow-sm col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Workspace Types</CardTitle>
            <CardDescription>Distribution by workspace type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.typeBreakdown
                .sort((a, b) => b.workspaceCount - a.workspaceCount)
                .slice(0, 4)
                .map((type) => (
                  <div key={type.type} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {type.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {type.workspaceCount} workspaces
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{type.documentCount}</span>
                      <p className="text-xs text-muted-foreground">
                        documents
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Additional Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Discussions */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Discussions</p>
              <div className="h-8 w-8 rounded-full bg-cyan-50 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-cyan-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.totalDiscussions}</span>
              <span className="text-xs text-muted-foreground mt-1">
                Active conversations
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Meetings */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Meetings</p>
              <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.totalMeetings}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {formatPercentage(statistics.meetingAttendanceRate)} attendance
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Tasks</p>
              <div className="h-8 w-8 rounded-full bg-pink-50 flex items-center justify-center">
                <Target className="h-4 w-4 text-pink-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.totalTasks}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {formatPercentage(statistics.taskCompletionRate)} completed
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}