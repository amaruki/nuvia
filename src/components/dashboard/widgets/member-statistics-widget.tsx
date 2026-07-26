"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { Card, CardContent } from "../../ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "../../ui/badge";
import {
  Users,
  UserCheck,
  UserPlus,
  UserX,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import { MemberStatistics } from "@/types/dashboard.types";

interface MemberStatisticsWidgetProps {
  statistics?: MemberStatistics;
  onExportData?: () => void;
  onViewAllMembers?: () => void;
}

// Mock statistics data - in a real app, this would come from an API
const mockStatistics: MemberStatistics = {
  totalMembers: 1245,
  activeMembers: 987,
  newMembersThisMonth: 42,
  expiredMemberships: 18,
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

const calculatePercentage = (part: number, total: number) => {
  return Math.round((part / total) * 100);
};

export function MemberStatisticsWidget({
  statistics = mockStatistics,
  onExportData,
  onViewAllMembers,
}: MemberStatisticsWidgetProps) {
  const activePercentage = calculatePercentage(statistics.activeMembers, statistics.totalMembers);
  const newPercentage = calculatePercentage(
    statistics.newMembersThisMonth,
    statistics.totalMembers,
  );
  const expiredPercentage = calculatePercentage(
    statistics.expiredMemberships,
    statistics.totalMembers,
  );

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
                <Users className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {formatNumber(statistics.totalMembers)} total members
                </span>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={onExportData} className="text-xs">
                  Export
                </Button>
                <Button variant="ghost" size="sm" onClick={onViewAllMembers} className="text-xs">
                  View all
                </Button>
              </div>
            </div>

            {/* Statistics cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Members */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" style={{ color: "var(--primary)" }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Total
                    </span>
                  </div>
                  <Badge className="bg-info/20 text-info">100%</Badge>
                </div>
                <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {formatNumber(statistics.totalMembers)}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  All registered members
                </div>
              </div>

              {/* Active Members */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5" style={{ color: "var(--chart-2)" }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Active
                    </span>
                  </div>
                  <Badge className="bg-chart-2/20 text-success">{activePercentage}%</Badge>
                </div>
                <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {formatNumber(statistics.activeMembers)}
                </div>
                <div className="flex items-center text-xs mt-1" style={{ color: "var(--chart-2)" }}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+5% from last month</span>
                </div>
              </div>

              {/* New Members */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" style={{ color: "var(--purple-500)" }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      New
                    </span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">{newPercentage}%</Badge>
                </div>
                <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {formatNumber(statistics.newMembersThisMonth)}
                </div>
                <div className="flex items-center text-xs mt-1" style={{ color: "var(--chart-2)" }}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+12% from last month</span>
                </div>
              </div>

              {/* Expired Memberships */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserX className="h-5 w-5" style={{ color: "var(--destructive)" }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Expired
                    </span>
                  </div>
                  <Badge className="bg-destructive/20 text-destructive">{expiredPercentage}%</Badge>
                </div>
                <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {formatNumber(statistics.expiredMemberships)}
                </div>
                <div
                  className="flex items-center text-xs mt-1"
                  style={{ color: "var(--destructive)" }}
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>-3% from last month</span>
                </div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-3">
              <div>
                <div
                  className="flex justify-between text-xs mb-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <span>Active Members</span>
                  <span>{activePercentage}%</span>
                </div>
                <div
                  className="w-full rounded-full h-2"
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${activePercentage}%`, backgroundColor: "var(--chart-2)" }}
                  ></div>
                </div>
              </div>

              <div>
                <div
                  className="flex justify-between text-xs mb-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <span>New Members (This Month)</span>
                  <span>{newPercentage}%</span>
                </div>
                <div
                  className="w-full rounded-full h-2"
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${newPercentage}%`, backgroundColor: "var(--purple-500)" }}
                  ></div>
                </div>
              </div>

              <div>
                <div
                  className="flex justify-between text-xs mb-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <span>Expired Memberships</span>
                  <span>{expiredPercentage}%</span>
                </div>
                <div
                  className="w-full rounded-full h-2"
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${expiredPercentage}%`,
                      backgroundColor: "var(--destructive)",
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="text-xs text-center pt-2" style={{ color: "var(--muted-foreground)" }}>
              Membership data updated daily. Last updated: Today at 9:00 AM
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  );
}
