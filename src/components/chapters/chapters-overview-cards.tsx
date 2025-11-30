"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChapterOverallStatistics } from "@/types/chapter.types";
import {
  Building2,
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface ChaptersOverviewCardsProps {
  statistics: ChapterOverallStatistics;
}

export function ChaptersOverviewCards({ statistics }: ChaptersOverviewCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
        {/* Total Chapters */}
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Chapters</p>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600" />
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
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{statistics.totalMembers.toLocaleString()}</span>
                <div className="flex items-center gap-1">
                  {getGrowthIcon(statistics.memberGrowthRate)}
                  <span className={`text-sm font-medium ${getGrowthColor(statistics.memberGrowthRate)}`}>
                    {formatPercentage(statistics.memberGrowthRate)}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {statistics.averageMembersPerChapter.toFixed(1)} avg per chapter
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Events */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Events</p>
              <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.totalEvents}</span>
              <span className="text-xs text-muted-foreground mt-1">
                Across all chapters
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-indigo-600" />
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
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Chapter Status Breakdown */}
        <Card className="shadow-sm col-span-1 lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Chapter Health</CardTitle>
            <CardDescription>Status distribution across all chapters</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center gap-4">
             {/* Status Item: Active */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Active</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                    {statistics.activeChapters}
                </Badge>
            </div>

            {/* Status Item: Pending */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <Clock className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Pending</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-amber-50 text-amber-700 border-amber-200">
                    {statistics.pendingChapters}
                </Badge>
            </div>

            {/* Status Item: Inactive */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <XCircle className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Inactive</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-slate-50 text-slate-700 border-slate-200">
                    {statistics.inactiveChapters}
                </Badge>
            </div>

            {/* Status Item: Suspended */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                        <AlertTriangle className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Suspended</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-rose-50 text-rose-700 border-rose-200">
                    {statistics.suspendedChapters}
                </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Chapters */}
        <Card className="shadow-sm col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Performing Chapters
            </CardTitle>
            <CardDescription>By member engagement and growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {statistics.topPerformingChapters
                .slice(0, 4)
                .map((chapter, index) => {
                  // Calculate percentage for the bar width (relative to max engagement score in set for visual)
                  const maxScore = Math.max(...statistics.topPerformingChapters.map(c => c.engagementScore));
                  const percentage = (chapter.engagementScore / maxScore) * 100;
                  
                  return (
                  <div key={chapter.chapterId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                          {chapter.chapterName}
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                            {chapter.location}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold block">{chapter.memberCount} members</span>
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
                         <span>Growth: <span className={chapter.growthRate > 0 ? "text-emerald-600 font-medium" : "text-amber-600"}>{formatPercentage(chapter.growthRate)}</span></span>
                         <span>Engagement: <span className="font-medium">{chapter.engagementScore.toFixed(1)}</span></span>
                    </div>
                  </div>
                )})}
            </div>
          </CardContent>
        </Card>

        {/* Regional Breakdown */}
        <Card className="shadow-sm col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Regional Distribution</CardTitle>
            <CardDescription>Chapters by region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.regionalBreakdown
                .sort((a, b) => b.chapterCount - a.chapterCount)
                .slice(0, 4)
                .map((region) => (
                  <div key={region.region} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {region.region}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {region.chapterCount} chapters
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{region.memberCount.toLocaleString()}</span>
                      <p className="text-xs text-muted-foreground">
                        members
                      </p>
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