import type { FinancialReport } from "@/types/finance";

export interface ReportsTableProps {
  reports: FinancialReport[];
  onViewDetails: (report: FinancialReport) => void;
  onDownload: (report: FinancialReport) => void;
  onEdit: (report: FinancialReport) => void;
  onDelete: (report: FinancialReport) => void;
  onUpdateStatus: (report: FinancialReport, status: FinancialReport["status"]) => void;
}

export interface ReportItemActions {
  onViewDetails: (report: FinancialReport) => void;
  onDownload: (report: FinancialReport) => void;
  onEdit: (report: FinancialReport) => void;
  onDelete: (report: FinancialReport) => void;
  onUpdateStatus: (report: FinancialReport, status: FinancialReport["status"]) => void;
}
