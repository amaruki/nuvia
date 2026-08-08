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
  FileText,
  BarChart3,
  PieChart,
  DollarSign,
  TrendingUp,
  Shield,
  Filter,
} from "lucide-react";

import { ReportsOverviewCards } from "@/components/finance/reports-overview-cards";
import { ReportsTable } from "@/components/finance/reports-table";
import { ReportsFilters } from "@/components/finance/reports-filters";
import { useFinanceReports } from "@/lib/hooks/use-finance-reports";
import { useHeader } from "@/contexts/dashboard-context";
import type { FinancialReport } from "@/types/finance.types";

export default function FinanceReports() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const { setHeader, clearHeader } = useHeader();

  const {
    reports,
    summary,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    updateReportStatus,
    downloadReport,
    editReport,
    deleteReport,
  } = useFinanceReports();

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
      description: "Computed financial reporting from the membership ledger",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (report: FinancialReport) => {
    router.push(`/dashboard/finance/reports/${report.id}`);
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
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm py-2 px-2">
            All Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Computed Reports</CardTitle>
                <CardDescription className="text-sm">
                  Live aggregates from the membership ledger
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded"
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${report.title}`}
                      onClick={() => handleViewDetails(report)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleViewDetails(report);
                        }
                      }}
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
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
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

          {/* Ledger Summary */}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Ledger Summary</CardTitle>
                <CardDescription className="text-sm">
                  Completed transactions over the last {summary.months} months, and receivables
                  still open on issued invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue (window)</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(Number.parseFloat(summary.totals.revenue))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Completed transactions</p>
                    <p className="text-sm font-medium">
                      {summary.totals.completedTransactionCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding receivables</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(Number.parseFloat(summary.outstanding.outstandingAmount))}{" "}
                      across {summary.outstanding.invoiceCount} invoices
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(Number.parseFloat(summary.outstanding.overdueAmount))} across{" "}
                      {summary.outstanding.overdueCount} invoices
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsTable
            reports={reports}
            onViewDetails={handleViewDetails}
            onDownload={downloadReport}
            onEdit={editReport}
            onDelete={deleteReport}
            onUpdateStatus={updateReportStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
