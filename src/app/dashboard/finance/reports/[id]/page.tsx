"use client";

/**
 * C4: detail view for one computed finance report. The report id selects a
 * live aggregate (see use-finance-reports): revenue by month, revenue by
 * tier, or outstanding receivables. Everything is rendered from the report
 * summary API — there are no stored report documents, journal entries or
 * review workflows.
 */

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeader } from "@/contexts/dashboard-context";
import { REPORT_IDS, useFinanceReports } from "@/lib/hooks/use-finance-reports";
import { OutstandingReceivablesSection } from "./_components/outstanding-receivables-section";
import {
  ReportErrorState,
  ReportLoadingState,
  ReportNotFoundState,
} from "./_components/page-states";
import { ReportHeaderCard } from "./_components/report-header-card";
import { RevenueByPeriodSection } from "./_components/revenue-by-period-section";
import { RevenueByTierSection } from "./_components/revenue-by-tier-section";

export default function FinanceReportDetail() {
  const params = useParams<{ id: string }>();
  const reportId = params.id;
  const { setHeader, clearHeader } = useHeader();
  const { reports, summary, loading, error, downloadReport, refreshData } = useFinanceReports();

  const report = reports.find((candidate) => candidate.id === reportId);

  useEffect(() => {
    setHeader({
      title: report?.title ?? "Financial Report",
      description: report?.description ?? "Computed from the membership ledger",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader, report?.title, report?.description]);

  if (loading) {
    return <ReportLoadingState />;
  }

  if (error) {
    return <ReportErrorState error={error} onRetry={refreshData} />;
  }

  if (!report || !summary) {
    return <ReportNotFoundState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/finance/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to reports
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recompute
          </Button>
          <Button size="sm" onClick={() => downloadReport(report)}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      <ReportHeaderCard report={report} />

      {report.id === REPORT_IDS.revenueByPeriod && <RevenueByPeriodSection summary={summary} />}

      {report.id === REPORT_IDS.revenueByTier && <RevenueByTierSection summary={summary} />}

      {report.id === REPORT_IDS.outstandingReceivables && (
        <OutstandingReceivablesSection summary={summary} />
      )}
    </div>
  );
}
