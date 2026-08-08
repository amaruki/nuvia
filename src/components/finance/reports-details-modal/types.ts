import type {
  FinancialReport,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  BudgetVsActualData,
  TaxDocumentData,
  AuditTrailData,
} from "@/types/finance";

export interface ReportsDetailsModalProps {
  report: FinancialReport | null;
  incomeStatementData?: IncomeStatementData | null;
  balanceSheetData?: BalanceSheetData | null;
  cashFlowData?: CashFlowData | null;
  budgetVsActualData?: BudgetVsActualData | null;
  taxDocumentData?: TaxDocumentData | null;
  auditTrailData?: AuditTrailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (report: FinancialReport) => void;
  onEdit: (report: FinancialReport) => void;
  onShare: (report: FinancialReport) => void;
  onUpdateStatus: (report: FinancialReport, status: FinancialReport["status"]) => void;
}
