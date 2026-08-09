import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Building2, Calendar, DollarSign, Users } from "lucide-react";
import type { ChapterStatisticsCardProps } from "./types";
import { formatCurrency } from "./helpers";

export function TotalChaptersCard({ statistics }: ChapterStatisticsCardProps) {
  return (
    <Card className="shadow-sm border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Chapters</p>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{statistics.totalChapters}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {statistics.activeChapters} active, {statistics.pendingChapters} pending
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TotalMembersCard({ statistics }: ChapterStatisticsCardProps) {
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
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{statistics.totalMembers.toLocaleString()}</span>
            <div className="flex items-center gap-1">
              {statistics.memberGrowthRate >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-rose-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  statistics.memberGrowthRate >= 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {statistics.memberGrowthRate.toFixed(1)}%
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {statistics.averageMembersPerChapter.toFixed(1)} avg per chapter
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TotalEventsCard({ statistics }: ChapterStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Events</p>
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
            <Calendar className="h-4 w-4 text-accent-foreground" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{statistics.totalEvents}</span>
          <span className="text-xs text-muted-foreground mt-1">Across all chapters</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TotalRevenueCard({ statistics }: ChapterStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
          <div className="h-8 w-8 rounded-full bg-chart-3/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-chart-3" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{formatCurrency(statistics.totalRevenue)}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {formatCurrency(statistics.totalRevenue / statistics.totalChapters)} avg per chapter
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
