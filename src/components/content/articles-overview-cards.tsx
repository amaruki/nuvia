"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArticleStatistics } from "@/types/article.types";
import {
  FileText,
  Eye,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Clock,
  Archive,
  Calendar,
  Users,
  BookOpen,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Book,
  Star,
  Timer,
} from "lucide-react";

interface ArticlesOverviewCardsProps {
  statistics: ArticleStatistics;
}

export function ArticlesOverviewCards({ statistics }: ArticlesOverviewCardsProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getEngagementColor = (score: number) => {
    if (score >= 85) return "text-emerald-600";
    if (score >= 70) return "text-amber-600";
    return "text-rose-600";
  };

  const getEngagementBadge = (score: number) => {
    if (score >= 85)
      return {
        className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
        text: "Excellent",
      };
    if (score >= 70)
      return { className: "bg-amber-100 text-amber-700 hover:bg-amber-100", text: "Good" };
    return { className: "bg-rose-100 text-rose-700 hover:bg-rose-100", text: "Needs Improvement" };
  };

  const engagementBadge = getEngagementBadge(statistics.averageEngagementScore);

  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Articles */}
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Articles</p>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{formatNumber(statistics.totalArticles)}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {statistics.publishedArticles} published, {statistics.draftArticles} drafts
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Published Articles */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Published</p>
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {formatNumber(statistics.publishedArticles)}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-2 h-5 ${engagementBadge.className}`}
                >
                  {engagementBadge.text}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {formatPercentage((statistics.publishedArticles / statistics.totalArticles) * 100)}{" "}
                publish rate
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Views</p>
              <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                <Eye className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{formatNumber(statistics.totalViews)}</span>
              <span className="text-xs text-muted-foreground mt-1">Across all articles</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Engagement */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${getEngagementColor(statistics.averageEngagementScore)}`}
                >
                  {formatPercentage(statistics.averageEngagementScore)}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-2 h-5 ${engagementBadge.className}`}
                >
                  {engagementBadge.text}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground mt-1">Average engagement score</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Article Status Breakdown */}
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

        {/* Top Performing Articles */}
        <Card className="shadow-sm col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top Performing Articles
            </CardTitle>
            <CardDescription>By engagement score and views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {statistics.topPerformingArticles.slice(0, 4).map((article, index) => {
                // Calculate percentage for bar width (relative to max engagement in set for visual)
                const maxEngagement = Math.max(
                  ...statistics.topPerformingArticles.map((a) => a.engagementScore),
                );
                const percentage = (article.engagementScore / maxEngagement) * 100;

                return (
                  <div key={article.articleId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                          {article.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
                        >
                          {article.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold block">{formatNumber(article.views)}</span>
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
                        Engagement:{" "}
                        <span
                          className={
                            article.engagementScore > 80
                              ? "text-emerald-600 font-medium"
                              : "text-amber-600"
                          }
                        >
                          {formatPercentage(article.engagementScore)}
                        </span>
                      </span>
                      <span>
                        Author: <span className="font-medium">{article.author}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Article Categories */}
        <Card className="shadow-sm col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Article Categories</CardTitle>
            <CardDescription>Distribution by article category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.articlesByCategory
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)
                .map((category) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Book className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {category.category.replace("_", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">{category.count} articles</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{formatNumber(category.views)}</span>
                      <p className="text-xs text-muted-foreground">
                        {formatPercentage(category.engagement)} engagement
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
