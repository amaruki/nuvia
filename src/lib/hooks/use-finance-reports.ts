"use client";

/**
 * C4: reports dashboard hook backed by the finance reporting service.
 *
 * Reports are COMPUTED LIVE from membership transactions and invoices via
 * GET /api/v1/finance/reports/summary — nothing is stored, so there are no
 * drafts, reviews or archives to manage. The three reports are:
 *   revenue-by-period        — completed transactions grouped by month
 *   revenue-by-tier          — completed transactions grouped by tier
 *   outstanding-receivables  — open ISSUED invoices with overdue split
 *
 * Downloads produce a CSV in the browser from the same computed data.
 */

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { FinancialReport, ReportFilterOptions, ReportStatistics } from "@/types/finance.types";

/** Wire shape of src/lib/services/finance-report.service.ts FinanceReportSummary. */
interface FinanceReportSummary {
  generatedAt: string;
  months: number;
  totals: {
    revenue: string;
    completedTransactionCount: number;
  };
  revenueByPeriod: { period: string; revenue: string; transactionCount: number }[];
  revenueByTier: { tierId: string; tierName: string; revenue: string; transactionCount: number }[];
  outstanding: {
    invoiceCount: number;
    outstandingAmount: string;
    overdueCount: number;
    overdueAmount: string;
  };
}

export const REPORT_IDS = {
  revenueByPeriod: "revenue-by-period",
  revenueByTier: "revenue-by-tier",
  outstandingReceivables: "outstanding-receivables",
} as const;

function buildReports(summary: FinanceReportSummary): FinancialReport[] {
  const generatedAt = new Date(summary.generatedAt);
  const endDate = generatedAt;
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - summary.months);

  const shared = {
    status: "published" as const,
    generatedBy: "Finance reporting service",
    generatedAt,
    startDate,
    endDate,
    downloadCount: 0,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };

  return [
    {
      id: REPORT_IDS.revenueByPeriod,
      title: "Monthly Revenue",
      description:
        "Completed membership transactions grouped by calendar month over the " +
        `last ${summary.months} months. Total revenue ${summary.totals.revenue} across ` +
        `${summary.totals.completedTransactionCount} completed transactions.`,
      type: "cash_flow",
      period: `Last ${summary.months} months`,
      tags: ["revenue", "transactions"],
      ...shared,
    },
    {
      id: REPORT_IDS.revenueByTier,
      title: "Revenue by Membership Tier",
      description:
        "Completed membership transactions grouped by the membership tier they " +
        "were billed for. Tiers with no completed transactions in the window are omitted.",
      type: "income_statement",
      period: `Last ${summary.months} months`,
      tags: ["revenue", "tiers"],
      ...shared,
    },
    {
      id: REPORT_IDS.outstandingReceivables,
      title: "Outstanding Receivables",
      description:
        "Issued invoices that are not yet paid or voided: open balance, and the " +
        "share already past its due date. Computed from the live invoice ledger.",
      type: "audit_trail",
      period: "As of today",
      tags: ["receivables", "invoices"],
      ...shared,
    },
  ];
}

function computeStatistics(reports: FinancialReport[]): ReportStatistics {
  const byType = new Map<string, number>();
  const byPeriod = new Map<string, number>();
  for (const report of reports) {
    byType.set(report.type, (byType.get(report.type) ?? 0) + 1);
    byPeriod.set(report.period, (byPeriod.get(report.period) ?? 0) + 1);
  }

  return {
    totalReports: reports.length,
    publishedReports: reports.filter((report) => report.status === "published").length,
    draftReports: 0,
    pendingReviewReports: 0,
    archivedReports: 0,
    totalDownloads: 0,
    reportsByType: Array.from(byType.entries()).map(([type, count]) => ({
      type,
      count,
      downloads: 0,
    })),
    reportsByPeriod: Array.from(byPeriod.entries()).map(([period, count]) => ({
      period,
      count,
      downloads: 0,
    })),
    recentActivity: [],
    monthlyTrend: [],
  };
}

function applyFilters(reports: FinancialReport[], filters: ReportFilterOptions): FinancialReport[] {
  return reports.filter((report) => {
    if (filters.type?.length && !filters.type.includes(report.type)) return false;
    if (filters.status?.length && !filters.status.includes(report.status)) return false;
    if (filters.period?.length && !filters.period.includes(report.period)) return false;
    if (filters.generatedBy?.length && !filters.generatedBy.includes(report.generatedBy)) {
      return false;
    }
    if (filters.tags?.length && !filters.tags.some((tag) => report.tags.includes(tag))) {
      return false;
    }
    if (filters.search) {
      const needle = filters.search.toLowerCase();
      if (!`${report.title} ${report.description}`.toLowerCase().includes(needle)) return false;
    }
    return true;
  });
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useFinanceReports() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReportFilterOptions>({});

  const summaryQuery = useQuery({
    queryKey: ["finance", "reports-summary"],
    queryFn: async () => {
      const { data } = await apiFetch<{ summary: FinanceReportSummary }>(
        "/api/v1/finance/reports/summary?months=12",
      );
      return data.summary;
    },
  });

  const summary = summaryQuery.data;

  const allReports = useMemo(() => (summary ? buildReports(summary) : []), [summary]);

  const reports = useMemo(() => applyFilters(allReports, filters), [allReports, filters]);

  const statistics = useMemo(() => computeStatistics(allReports), [allReports]);

  const downloadReport = (report: FinancialReport) => {
    if (!summary) return;

    if (report.id === REPORT_IDS.revenueByPeriod) {
      downloadCsv(
        "monthly-revenue.csv",
        toCsv(
          summary.revenueByPeriod.map((row) => ({
            period: row.period,
            revenue: row.revenue,
            transaction_count: row.transactionCount,
          })),
        ),
      );
      return;
    }

    if (report.id === REPORT_IDS.revenueByTier) {
      downloadCsv(
        "revenue-by-tier.csv",
        toCsv(
          summary.revenueByTier.map((row) => ({
            tier: row.tierName,
            revenue: row.revenue,
            transaction_count: row.transactionCount,
          })),
        ),
      );
      return;
    }

    downloadCsv(
      "outstanding-receivables.csv",
      toCsv([
        { metric: "open_invoices", value: summary.outstanding.invoiceCount },
        { metric: "outstanding_amount", value: summary.outstanding.outstandingAmount },
        { metric: "overdue_invoices", value: summary.outstanding.overdueCount },
        { metric: "overdue_amount", value: summary.outstanding.overdueAmount },
      ]),
    );
  };

  const editReport = (_report: FinancialReport) => {
    toast.info("Reports are computed live from the ledger — there is nothing to edit.");
  };

  const deleteReport = (_report: FinancialReport) => {
    toast.info("Reports are computed live from the ledger — there is nothing to delete.");
  };

  const updateReportStatus = (_report: FinancialReport, _status: FinancialReport["status"]) => {
    toast.info("Reports are computed live from the ledger — they are always current.");
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["finance", "reports-summary"] });
  };

  const updateFilters = (next: Partial<ReportFilterOptions>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  const clearFilters = () => setFilters({});

  return {
    reports,
    summary: summary ?? null,
    statistics,
    loading: summaryQuery.isPending,
    error: summaryQuery.error
      ? summaryQuery.error instanceof ApiClientError
        ? summaryQuery.error.message
        : "Failed to load financial reports"
      : null,
    filters,
    downloadReport,
    editReport,
    deleteReport,
    updateReportStatus,
    refreshData,
    updateFilters,
    clearFilters,
  };
}
