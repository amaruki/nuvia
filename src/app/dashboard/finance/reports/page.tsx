"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw,
  AlertTriangle,
  Download,
  Plus,
  FileText,
  BarChart3,
  PieChart,
  DollarSign,
  TrendingUp,
  Shield,
  Calendar,
  Filter,
  Eye,
} from "lucide-react";

import { ReportsOverviewCards } from "@/components/finance/reports-overview-cards";
import { ReportsTable } from "@/components/finance/reports-table";
import { ReportsFilters } from "@/components/finance/reports-filters";
import { useReports } from "@/lib/hooks/use-reports";
import { useHeader } from "@/contexts/dashboard-context";
import { FinancialReport } from "@/types/finance.types";
import { logger } from "@/lib/logger";

export default function FinanceReports() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const { setHeader, clearHeader } = useHeader();

  const {
    reports,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    updateReportStatus,
    downloadReport,
    deleteReport,
  } = useReports();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    setHeader({
      title: "Financial Reports",
      description: "Formal financial reporting and documentation for compliance and analysis",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (report: FinancialReport) => {
    router.push(`/dashboard/finance/reports/${report.id}`);
  };

  const handleDownload = (report: FinancialReport) => {
    downloadReport(report.id);
  };

  const handleEdit = (report: FinancialReport) => {
    // TODO: Implement edit functionality
    logger.info("Edit report", report);
  };

  const handleShare = (report: FinancialReport) => {
    // TODO: Implement share functionality
    logger.info("Share report", report);
  };

  const handleDelete = (report: FinancialReport) => {
    if (window.confirm(`Are you sure you want to delete "${report.title}"?`)) {
      deleteReport(report.id);
    }
  };

  const handleUpdateStatus = (report: FinancialReport, status: FinancialReport["status"]) => {
    updateReportStatus(report.id, status);
  };

  const handleGenerateReport = () => {
    // TODO: Implement generate report functionality
    logger.info("Generate new report");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <ReportsOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {reports.length} reports total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.publishedReports} published
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={handleGenerateReport}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Generate Report</span>
            <span className="sm:hidden">Generate</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <ReportsFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm py-2 px-2">
            All Reports
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs sm:text-sm py-2 px-2">
            Templates
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs sm:text-sm py-2 px-2">
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Recent Reports</CardTitle>
                <CardDescription className="text-sm">
                  Latest financial reports generated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded"
                      onClick={() => handleViewDetails(report)}
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-sm font-medium truncate">{report.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {report.type.replace("_", " ")} • {report.period}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge
                          variant={
                            report.status === "published"
                              ? "default"
                              : report.status === "pending_review"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {report.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Report Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Report Types</CardTitle>
                <CardDescription className="text-sm">
                  Available financial report categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "income_statement", icon: BarChart3, label: "Income Statement" },
                    { type: "balance_sheet", icon: PieChart, label: "Balance Sheet" },
                    { type: "cash_flow", icon: DollarSign, label: "Cash Flow" },
                    { type: "budget_vs_actual", icon: TrendingUp, label: "Budget vs Actual" },
                    { type: "tax_document", icon: FileText, label: "Tax Document" },
                    { type: "audit_trail", icon: Shield, label: "Audit Trail" },
                  ].map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {reports.filter((r) => r.type === item.type).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Reports */}
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Monthly Trend</CardTitle>
                <CardDescription className="text-sm">
                  Report generation and download trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.monthlyTrend.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm font-medium truncate">{month.month}</span>
                        <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{month.generated} generated</p>
                        <p className="text-xs text-muted-foreground">
                          {month.downloaded} downloads
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsTable
            reports={reports}
            onViewDetails={handleViewDetails}
            onDownload={handleDownload}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Income Statement Template",
                description: "Standard income statement format with revenue and expense breakdowns",
                icon: BarChart3,
                type: "income_statement",
              },
              {
                title: "Balance Sheet Template",
                description: "Comprehensive balance sheet with assets, liabilities, and equity",
                icon: PieChart,
                type: "balance_sheet",
              },
              {
                title: "Cash Flow Template",
                description:
                  "Detailed cash flow statement with operating, investing, and financing activities",
                icon: DollarSign,
                type: "cash_flow",
              },
              {
                title: "Budget vs Actual Template",
                description: "Comparison template for budgeted vs actual performance analysis",
                icon: TrendingUp,
                type: "budget_vs_actual",
              },
              {
                title: "Tax Document Template",
                description: "Tax documentation template for compliance and filing",
                icon: FileText,
                type: "tax_document",
              },
              {
                title: "Audit Trail Template",
                description: "Audit trail template for compliance and internal controls",
                icon: Shield,
                type: "audit_trail",
              },
            ].map((template, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-md bg-primary/10">
                      <template.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">Template</Badge>
                  </div>
                  <CardTitle className="text-base sm:text-lg">{template.title}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => logger.info("Use template", template.type)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Scheduled Reports</CardTitle>
              <CardDescription className="text-sm">
                Automated report generation schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No scheduled reports yet</p>
                <Button className="mt-4" onClick={() => logger.info("Schedule report")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
