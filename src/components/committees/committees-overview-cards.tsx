"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommitteeOverallStatistics } from "@/types/committee";
import { Users, Target, Calendar, CheckSquare, TrendingUp, Award, Briefcase } from "lucide-react";

interface CommitteesOverviewCardsProps {
  statistics: CommitteeOverallStatistics;
}

export function CommitteesOverviewCards({ statistics }: CommitteesOverviewCardsProps) {
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Committees */}
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Committees</p>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.totalCommittees}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {statistics.activeCommittees} active, {statistics.pendingCommittees} pending
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
                {statistics.averageMembersPerCommittee.toFixed(1)} avg per committee
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Meetings */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Meetings</p>
              <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.totalMeetings}</span>
              <span className="text-xs text-muted-foreground mt-1">This month</span>
            </div>
          </CardContent>
        </Card>

        {/* Goal Completion Rate */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Goal Completion</p>
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <Target className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">
                {formatPercentage(statistics.goalCompletionRate)}
              </span>
              <span className="text-xs text-muted-foreground mt-1">Across all committees</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Committee Status Breakdown */}
        <Card className="shadow-sm col-span-1 lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Committee Health</CardTitle>
            <CardDescription>Status distribution across all committees</CardDescription>
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
              <Badge
                variant="outline"
                className="text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                {statistics.activeCommittees}
              </Badge>
            </div>

            {/* Status Item: Pending */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Pending</span>
              </div>
              <Badge
                variant="outline"
                className="text-sm font-bold bg-amber-50 text-amber-700 border-amber-200"
              >
                {statistics.pendingCommittees}
              </Badge>
            </div>

            {/* Status Item: Inactive */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Briefcase className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Inactive</span>
              </div>
              <Badge
                variant="outline"
                className="text-sm font-bold bg-slate-50 text-slate-700 border-slate-200"
              >
                {statistics.inactiveCommittees}
              </Badge>
            </div>

            {/* Status Item: Suspended */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Target className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Suspended</span>
              </div>
              <Badge
                variant="outline"
                className="text-sm font-bold bg-rose-50 text-rose-700 border-rose-200"
              >
                {statistics.suspendedCommittees}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Committees */}
        <Card className="shadow-sm col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top Performing Committees
            </CardTitle>
            <CardDescription>By impact score and goal completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {statistics.topPerformingCommittees.slice(0, 4).map((committee) => {
                // Calculate percentage for the bar width (relative to max impact score in set for visual)
                const maxScore = Math.max(
                  ...statistics.topPerformingCommittees.map((c) => c.impactScore),
                );
                const percentage = (committee.impactScore / maxScore) * 100;

                return (
                  <div key={committee.committeeId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                          {committee.committeeName}
                        </span>
                        <Badge variant="secondary" className="text-[11px] h-5 px-1.5 font-normal">
                          {committee.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold block">{committee.memberCount} members</span>
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
                      <span>
                        Goals:{" "}
                        <span className="font-medium">
                          {formatPercentage(committee.goalCompletionRate)}
                        </span>
                      </span>
                      <span>
                        Impact:{" "}
                        <span className="font-medium">{committee.impactScore.toFixed(1)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Committee Type Breakdown */}
        <Card className="shadow-sm col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Committee Types</CardTitle>
            <CardDescription>Distribution by committee type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.typeBreakdown
                .sort((a, b) => b.committeeCount - a.committeeCount)
                .slice(0, 4)
                .map((type) => (
                  <div
                    key={type.type}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {type.type.replace("_", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {type.committeeCount} committees
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{type.memberCount}</span>
                      <p className="text-xs text-muted-foreground">members</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
