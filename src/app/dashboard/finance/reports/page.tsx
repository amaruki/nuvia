"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ReportsOverviewCards } from "@/components/finance/reports-overview-cards";
import { ReportsTable } from "@/components/finance/reports-table";
import { ReportsFilters } from "@/components/finance/reports-filters";
import { useFinanceReports } from "@/lib/hooks/use-finance-reports";
import { useHeader } from "@/contexts/dashboard-context";
import type { FinancialReport } from "@/types/finance";
import { LedgerSummaryCard } from "./_components/ledger-summary-card";
import { ReportsErrorState, ReportsLoadingState } from "./_components/page-states";
import { RecentReportsCard } from "./_components/recent-reports-card";
import { ReportsActionBar } from "./_components/reports-action-bar";
import { ReportTypesCard } from "./_components/report-types-card";

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
    return <ReportsLoadingState />;
  }

  if (error) {
    return <ReportsErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <ReportsOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <ReportsActionBar
        totalReports={reports.length}
        publishedReports={statistics?.publishedReports}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refreshData}
      />

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
            <RecentReportsCard reports={reports} onViewDetails={handleViewDetails} />

            {/* Report Types */}
            <ReportTypesCard reports={reports} />
          </div>

          {/* Ledger Summary */}
          {summary && <LedgerSummaryCard summary={summary} />}
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
