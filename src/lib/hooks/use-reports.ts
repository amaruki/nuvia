"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FinancialReport,
  ReportStatistics,
  ReportFilterOptions,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  BudgetVsActualData,
  TaxDocumentData,
  AuditTrailData,
} from "@/types/finance.types";
import {
  mockReports,
  mockReportStatistics,
  mockIncomeStatementData,
  mockBalanceSheetData,
  mockCashFlowData,
  mockBudgetVsActualData,
  mockTaxDocumentData,
  mockAuditTrailData,
} from "@/lib/data/mock-reports-data";

export function useReports() {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilterOptions>({});

  // Mock data for different report types
  const [incomeStatementData, setIncomeStatementData] = useState<IncomeStatementData | null>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [budgetVsActualData, setBudgetVsActualData] = useState<BudgetVsActualData | null>(null);
  const [taxDocumentData, setTaxDocumentData] = useState<TaxDocumentData | null>(null);
  const [auditTrailData, setAuditTrailData] = useState<AuditTrailData | null>(null);

  // Fetch reports data
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Apply filters
      let filteredReports = [...mockReports];

      if (filters.type && filters.type.length > 0) {
        filteredReports = filteredReports.filter((report) => filters.type!.includes(report.type));
      }

      if (filters.status && filters.status.length > 0) {
        filteredReports = filteredReports.filter((report) =>
          filters.status!.includes(report.status),
        );
      }

      if (filters.period && filters.period.length > 0) {
        filteredReports = filteredReports.filter((report) =>
          filters.period!.includes(report.period),
        );
      }

      if (filters.dateRange) {
        filteredReports = filteredReports.filter(
          (report) =>
            report.startDate >= filters.dateRange!.start &&
            report.endDate <= filters.dateRange!.end,
        );
      }

      if (filters.generatedBy && filters.generatedBy.length > 0) {
        filteredReports = filteredReports.filter((report) =>
          filters.generatedBy!.includes(report.generatedBy),
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredReports = filteredReports.filter((report) =>
          filters.tags!.some((tag) => report.tags.includes(tag)),
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredReports = filteredReports.filter(
          (report) =>
            report.title.toLowerCase().includes(searchLower) ||
            report.description.toLowerCase().includes(searchLower) ||
            report.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
        );
      }

      setReports(filteredReports);
      setStatistics(mockReportStatistics);

      // Set mock data for different report types
      setIncomeStatementData(mockIncomeStatementData);
      setBalanceSheetData(mockBalanceSheetData);
      setCashFlowData(mockCashFlowData);
      setBudgetVsActualData(mockBudgetVsActualData);
      setTaxDocumentData(mockTaxDocumentData);
      setAuditTrailData(mockAuditTrailData);
    } catch (err) {
      setError("Failed to fetch reports data");
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial data fetch
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ReportFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Refresh data
  const refreshData = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  // Get report by ID
  const getReportById = useCallback(
    (id: string) => {
      return reports.find((report) => report.id === id) || null;
    },
    [reports],
  );

  // Update report status
  const updateReportStatus = useCallback(async (id: string, status: FinancialReport["status"]) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      setReports((prev) =>
        prev.map((report) =>
          report.id === id
            ? {
                ...report,
                status,
                updatedAt: new Date(),
                ...(status === "published" && { publishedAt: new Date() }),
                ...(status === "pending_review" && { reviewedAt: new Date() }),
              }
            : report,
        ),
      );

      return true;
    } catch (err) {
      console.error("Error updating report status:", err);
      return false;
    }
  }, []);

  // Download report
  const downloadReport = useCallback(
    async (id: string) => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Increment download count
        setReports((prev) =>
          prev.map((report) =>
            report.id === id ? { ...report, downloadCount: report.downloadCount + 1 } : report,
          ),
        );

        // In a real app, this would trigger a file download
        const report = getReportById(id);
        if (report?.fileUrl) {
          console.log(`Downloading report: ${report.fileUrl}`);
          // window.open(report.fileUrl, '_blank');
        }

        return true;
      } catch (err) {
        console.error("Error downloading report:", err);
        return false;
      }
    },
    [getReportById],
  );

  // Delete report
  const deleteReport = useCallback(async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      setReports((prev) => prev.filter((report) => report.id !== id));

      return true;
    } catch (err) {
      console.error("Error deleting report:", err);
      return false;
    }
  }, []);

  // Generate new report
  const generateReport = useCallback(
    async (
      reportData: Omit<FinancialReport, "id" | "createdAt" | "updatedAt" | "downloadCount">,
    ) => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newReport: FinancialReport = {
          ...reportData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          downloadCount: 0,
        };

        setReports((prev) => [newReport, ...prev]);

        return newReport;
      } catch (err) {
        console.error("Error generating report:", err);
        return null;
      }
    },
    [],
  );

  return {
    // Data
    reports,
    statistics,
    incomeStatementData,
    balanceSheetData,
    cashFlowData,
    budgetVsActualData,
    taxDocumentData,
    auditTrailData,

    // State
    loading,
    error,
    filters,

    // Actions
    updateFilters,
    clearFilters,
    refreshData,
    getReportById,
    updateReportStatus,
    downloadReport,
    deleteReport,
    generateReport,
  };
}
