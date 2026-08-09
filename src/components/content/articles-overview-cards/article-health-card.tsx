"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive, Calendar, CheckCircle2, Clock, FileText } from "lucide-react";
import type { ArticleStatisticsCardProps } from "./types";

export function ArticleHealthCard({ statistics }: ArticleStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2 flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Article Health</CardTitle>
        <CardDescription>Status distribution across all articles</CardDescription>
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
            {statistics.publishedArticles}
          </Badge>
        </div>

        {/* Status Item: Draft */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Draft</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-slate-50 text-slate-700 border-slate-200"
          >
            {statistics.draftArticles}
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
            {statistics.scheduledArticles}
          </Badge>
        </div>

        {/* Status Item: Under Review */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Under Review</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-amber-50 text-amber-700 border-amber-200"
          >
            {statistics.articlesByStatus.find((s) => s.status === "review")?.count || 0}
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
            {statistics.archivedArticles}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
