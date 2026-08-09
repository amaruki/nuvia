import { BarChart3, DollarSign, FileText, PieChart, Shield, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialReport } from "@/types/finance";

const REPORT_TYPE_ITEMS = [
  { type: "income_statement", icon: BarChart3, label: "Income Statement" },
  { type: "balance_sheet", icon: PieChart, label: "Balance Sheet" },
  { type: "cash_flow", icon: DollarSign, label: "Cash Flow" },
  { type: "budget_vs_actual", icon: TrendingUp, label: "Budget vs Actual" },
  { type: "tax_document", icon: FileText, label: "Tax Document" },
  { type: "audit_trail", icon: Shield, label: "Audit Trail" },
];

interface ReportTypesCardProps {
  reports: FinancialReport[];
}

export function ReportTypesCard({ reports }: ReportTypesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Report Types</CardTitle>
        <CardDescription className="text-sm">Available financial report categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {REPORT_TYPE_ITEMS.map((item) => (
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
  );
}
