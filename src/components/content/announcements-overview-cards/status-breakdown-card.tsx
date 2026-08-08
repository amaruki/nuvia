"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Calendar, Archive, Target, AlertTriangle } from "lucide-react";
import type { AnnouncementStatisticsCardProps } from "./types";

export function StatusBreakdownCard({ statistics }: AnnouncementStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2 flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Announcement Health</CardTitle>
        <CardDescription>Status distribution across all announcements</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center gap-4">
        {/* Status Item: Published */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Published</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            {statistics.activeAnnouncements}
          </Badge>
        </div>

        {/* Status Item: Draft */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Draft</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-slate-50 text-slate-700 border-slate-200"
          >
            {statistics.totalAnnouncements - statistics.activeAnnouncements}
          </Badge>
        </div>

        {/* Status Item: Scheduled */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Scheduled</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-blue-50 text-blue-700 border-blue-200"
          >
            {0}
          </Badge>
        </div>

        {/* Status Item: Archived */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Archive className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Archived</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-slate-50 text-slate-700 border-slate-200"
          >
            {statistics.expiredAnnouncements}
          </Badge>
        </div>

        {/* Status Item: Active */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Target className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Active</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-green-50 text-green-700 border-green-200"
          >
            {statistics.activeAnnouncements}
          </Badge>
        </div>

        {/* Status Item: Expired */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Expired</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-red-50 text-red-700 border-red-200"
          >
            {statistics.expiredAnnouncements}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
