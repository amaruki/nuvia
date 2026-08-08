import { BarChart3, PieChart, DollarSign, TrendingUp, FileText, Shield } from "lucide-react";

export default function getReportTypeIcon(type: string) {
  switch (type) {
    case "income_statement":
      return <BarChart3 className="h-5 w-5" />;
    case "balance_sheet":
      return <PieChart className="h-5 w-5" />;
    case "cash_flow":
      return <DollarSign className="h-5 w-5" />;
    case "budget_vs_actual":
      return <TrendingUp className="h-5 w-5" />;
    case "tax_document":
      return <FileText className="h-5 w-5" />;
    case "audit_trail":
      return <Shield className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}
