import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type {
  FinancialReport,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  BudgetVsActualData,
  TaxDocumentData,
  AuditTrailData,
} from "@/types/finance";
import IncomeStatementTab from "./income-statement-tab";
import BalanceSheetTab from "./balance-sheet-tab";
import CashFlowTab from "./cash-flow-tab";
import BudgetVsActualTab from "./budget-vs-actual-tab";
import TaxDocumentTab from "./tax-document-tab";
import AuditTrailTab from "./audit-trail-tab";

interface ReportContentProps {
  report: FinancialReport;
  incomeStatementData?: IncomeStatementData | null;
  balanceSheetData?: BalanceSheetData | null;
  cashFlowData?: CashFlowData | null;
  budgetVsActualData?: BudgetVsActualData | null;
  taxDocumentData?: TaxDocumentData | null;
  auditTrailData?: AuditTrailData | null;
}

export default function ReportContent({
  report,
  incomeStatementData,
  balanceSheetData,
  cashFlowData,
  budgetVsActualData,
  taxDocumentData,
  auditTrailData,
}: ReportContentProps) {
  switch (report.type) {
    case "income_statement":
      return <IncomeStatementTab incomeStatementData={incomeStatementData} />;
    case "balance_sheet":
      return <BalanceSheetTab balanceSheetData={balanceSheetData} />;
    case "cash_flow":
      return <CashFlowTab cashFlowData={cashFlowData} />;
    case "budget_vs_actual":
      return <BudgetVsActualTab budgetVsActualData={budgetVsActualData} />;
    case "tax_document":
      return <TaxDocumentTab taxDocumentData={taxDocumentData} />;
    case "audit_trail":
      return <AuditTrailTab auditTrailData={auditTrailData} />;
    default:
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Report content not available</p>
            </div>
          </CardContent>
        </Card>
      );
  }
}
