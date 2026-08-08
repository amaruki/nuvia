import { BarChart3, PieChart, DollarSign, TrendingUp, FileText, Shield } from "lucide-react";

export default function getReportTypeIcon(type: string) {
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
}
