import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinanceReportSummary } from "@/lib/hooks/use-finance-reports";
import { formatCurrency } from "./helpers";

interface LedgerSummaryCardProps {
  summary: FinanceReportSummary;
}

export function LedgerSummaryCard({ summary }: LedgerSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Ledger Summary</CardTitle>
        <CardDescription className="text-sm">
          Completed transactions over the last {summary.months} months, and receivables still open
          on issued invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Revenue (window)</p>
            <p className="text-sm font-medium">
              {formatCurrency(Number.parseFloat(summary.totals.revenue))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
            <p className="text-sm font-medium">{summary.totals.completedTransactionCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding receivables</p>
            <p className="text-sm font-medium">
              {formatCurrency(Number.parseFloat(summary.outstanding.outstandingAmount))} across{" "}
              {summary.outstanding.invoiceCount} invoices
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-sm font-medium">
              {formatCurrency(Number.parseFloat(summary.outstanding.overdueAmount))} across{" "}
              {summary.outstanding.overdueCount} invoices
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
