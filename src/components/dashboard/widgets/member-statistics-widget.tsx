"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { EmptyState } from "../../ui/empty-state";
import { Card, CardContent } from "../../ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "../../ui/badge";
import { Users, UserCheck, UserPlus, UserX, TrendingUp, TrendingDown } from "lucide-react";
import { MemberStatistics } from "@/types/dashboard.types";

interface MemberStatisticsWidgetProps {
  statistics?: MemberStatistics;
  onViewAllMembers?: () => void;
}

const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);

const calculatePercentage = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

export function MemberStatisticsWidget({
  statistics,
  onViewAllMembers,
}: MemberStatisticsWidgetProps) {
  // No real data yet (or the caller lacks memberships:read) — honest empty
  // state instead of placeholder numbers.
  if (!statistics) {
    return (
      <WidgetContainer
        type="member-statistics"
        title="Member Statistics"
        description="Overview of community membership"
        size="medium"
      >
        <EmptyState
          icon={<Users className="h-8 w-8 text-muted-foreground" />}
          title="No membership data yet"
          description="Member totals, activity and signups appear here once people join your organization."
        />
      </WidgetContainer>
    );
  }

  const activePercentage = calculatePercentage(statistics.activeMembers, statistics.totalMembers);
  const newPercentage = calculatePercentage(
    statistics.newMembersThisMonth,
    statistics.totalMembers,
  );
  const expiredPercentage = calculatePercentage(
    statistics.expiredMemberships,
    statistics.totalMembers,
  );
  const newMemberDelta =
    statistics.newMembersLastMonth != null
      ? statistics.newMembersThisMonth - statistics.newMembersLastMonth
      : null;

  return (
    <WidgetContainer
      type="member-statistics"
      title="Member Statistics"
      description="Overview of community membership"
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {formatNumber(statistics.totalMembers)} total members
                </span>
              </div>
              {onViewAllMembers && (
                <Button variant="ghost" size="sm" onClick={onViewAllMembers} className="text-xs">
                  View all
                </Button>
              )}
            </div>

            {/* Statistics cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Members */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                  </div>
                  {/* UI-11 token fix: --info is undefined in globals.css; the
                      badge family is tinted chart token + foreground text
                      for contrast in both themes. */}
                  <Badge className="bg-chart-1/20 text-foreground">100%</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatNumber(statistics.totalMembers)}
                </div>
                <div className="text-xs mt-1 text-muted-foreground">All registered members</div>
              </div>

              {/* Active Members */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-chart-2" />
                    <span className="text-sm font-medium text-muted-foreground">Active</span>
                  </div>
                  {/* UI-11 token fix: --success is undefined in globals.css. */}
                  <Badge className="bg-chart-2/20 text-foreground">{activePercentage}%</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatNumber(statistics.activeMembers)}
                </div>
                <div className="text-xs mt-1 text-muted-foreground">
                  {activePercentage}% of all members
                </div>
              </div>

              {/* New Members */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {/* UI-11 token fix: --purple-500 is undefined in
                        globals.css; chart-3 is the warm accent slot. */}
                    <UserPlus className="h-5 w-5 text-chart-3" />
                    <span className="text-sm font-medium text-muted-foreground">New</span>
                  </div>
                  <Badge className="bg-chart-3/20 text-foreground">{newPercentage}%</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatNumber(statistics.newMembersThisMonth)}
                </div>
                {newMemberDelta != null ? (
                  <div
                    className={cn(
                      "flex items-center text-xs mt-1",
                      newMemberDelta >= 0 ? "text-chart-2" : "text-destructive",
                    )}
                  >
                    {newMemberDelta >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    <span>
                      {newMemberDelta > 0 ? "+" : ""}
                      {formatNumber(newMemberDelta)} vs last month
                    </span>
                  </div>
                ) : (
                  <div className="text-xs mt-1 text-muted-foreground">Signups this month</div>
                )}
              </div>

              {/* Expired Memberships */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserX className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-medium text-muted-foreground">Expired</span>
                  </div>
                  {/* UI-11: tint keeps the destructive cue; foreground text
                      for contrast (destructive red alone is ~3.6:1 on card). */}
                  <Badge className="bg-destructive/20 text-foreground">{expiredPercentage}%</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatNumber(statistics.expiredMemberships)}
                </div>
                <div className="text-xs mt-1 text-muted-foreground">
                  {expiredPercentage}% of all members
                </div>
              </div>
            </div>

            {/* Progress bars (UI-11 chart a11y stopgap): hand-built div bars
                showing real part-to-whole percentages. Each track is a
                progressbar with an explicit value and accessible name; the
                fill is aria-hidden decoration. Replace with shadcn chart
                when an analytics source exists (plan decision D5). */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                  <span>Active Members</span>
                  <span>{activePercentage}%</span>
                </div>
                <div
                  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- styled div bar; native <progress> cannot host the themed fill (UI-11 stopgap, plan D5).
                  role="progressbar"
                  aria-label="Active members as a percentage of all members"
                  aria-valuenow={activePercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full rounded-full h-2 bg-muted"
                >
                  <div
                    aria-hidden="true"
                    className="h-2 rounded-full bg-chart-2"
                    style={{ width: `${activePercentage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                  <span>New Members (This Month)</span>
                  <span>{newPercentage}%</span>
                </div>
                <div
                  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- same UI-11 stopgap rationale as the active-members bar.
                  role="progressbar"
                  aria-label="New members this month as a percentage of all members"
                  aria-valuenow={newPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full rounded-full h-2 bg-muted"
                >
                  <div
                    aria-hidden="true"
                    className="h-2 rounded-full bg-chart-3"
                    style={{ width: `${newPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                  <span>Expired Memberships</span>
                  <span>{expiredPercentage}%</span>
                </div>
                <div
                  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- same UI-11 stopgap rationale as the active-members bar.
                  role="progressbar"
                  aria-label="Expired memberships as a percentage of all members"
                  aria-valuenow={expiredPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full rounded-full h-2 bg-muted"
                >
                  <div
                    aria-hidden="true"
                    className="h-2 rounded-full bg-destructive"
                    style={{ width: `${expiredPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="text-xs text-center pt-2 text-muted-foreground">
              Live counts derived from member subscriptions (statuses include active and trialing).
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  );
}
