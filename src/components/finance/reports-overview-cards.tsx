"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  TrendingUp,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
  DollarSign,
  Shield,
} from "lucide-react";
import { ReportStatistics } from "@/types/finance";

interface ReportsOverviewCardsProps {
  statistics: ReportStatistics;
}

export function ReportsOverviewCards({ statistics }: ReportsOverviewCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCompletionRate = () => {
    if (statistics.totalReports === 0) return 0;
    return (statistics.publishedReports / statistics.totalReports) * 100;
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return "text-success";
    if (rate >= 60) return "text-warning";
    return "text-destructive";
  };

  const getCompletionRateBadge = (rate: number) => {
    if (rate >= 80) return { variant: "default" as const, text: "Excellent" };
    if (rate >= 60) return { variant: "secondary" as const, text: "Good" };
    return { variant: "destructive" as const, text: "Needs Attention" };
  };

  const completionRate = getCompletionRate();
  const completionRateBadge = getCompletionRateBadge(completionRate);

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "income_statement":
        return <BarChart3 className="h-4 w-4" />;
      case "balance_sheet":
        return <PieChart className="h-4 w-4" />;
      case "cash_flow":
        return <DollarSign className="h-4 w-4" />;
      case "budget_vs_actual":
        return <TrendingUp className="h-4 w-4" />;
      case "tax_document":
        return <FileText className="h-4 w-4" />;
      case "audit_trail":
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Total Reports</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{statistics.totalReports}</div>
          <p className="text-xs text-muted-foreground">{statistics.publishedReports} published</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Completion Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-xl sm:text-2xl font-bold ${getCompletionRateColor(completionRate)}`}
          >
            {completionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            <Badge variant={completionRateBadge.variant} className="text-xs">
              {completionRateBadge.text}
            </Badge>
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Total Downloads</CardTitle>
          <Download className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{statistics.totalDownloads}</div>
          <p className="text-xs text-muted-foreground">
            {statistics.totalReports > 0
              ? Math.round(statistics.totalDownloads / statistics.totalReports)
              : 0}{" "}
            avg per report
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Pending Review</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-warning">
            {statistics.pendingReviewReports}
          </div>
          <p className="text-xs text-muted-foreground">{statistics.draftReports} drafts</p>
        </CardContent>
      </Card>

      {/* Report Types Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Reports by Type</CardTitle>
          <CardDescription className="text-sm">Distribution of reports by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statistics.reportsByType.map((type, index) => (
              <div
                key={type.type}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-primary/10">{getReportTypeIcon(type.type)}</div>
                  <div>
                    <p className="text-sm font-medium capitalize">{type.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{type.count} reports</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{type.downloads}</p>
                  <p className="text-xs text-muted-foreground">downloads</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
          <CardDescription className="text-sm">Latest report actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistics.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-1 rounded-full bg-muted">
                    {activity.action === "Published" && (
                      <CheckCircle className="h-3 w-3 text-success" />
                    )}
                    {activity.action === "Created" && <FileText className="h-3 w-3 text-info" />}
                    {activity.action === "Generated" && (
                      <BarChart3 className="h-3 w-3 text-accent-foreground" />
                    )}
                    {activity.action === "Downloaded" && (
                      <Download className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.reportTitle} • {activity.performedBy}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.performedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Monthly Trend</CardTitle>
          <CardDescription className="text-sm">
            Report generation and download trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statistics.monthlyTrend.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span>{month.generated}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="h-3 w-3 text-muted-foreground" />
                      <span>{month.downloaded}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground w-12">Gen</span>
                    <Progress value={month.generated / 10} className="flex-1 h-2" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground w-12">Down</span>
                    <Progress value={month.downloaded / 100} className="flex-1 h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
