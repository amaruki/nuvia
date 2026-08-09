import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FinanceReportSummary } from "@/lib/hooks/use-finance-reports";
import { formatCurrency } from "./helpers";

interface RevenueByPeriodSectionProps {
  summary: FinanceReportSummary;
}

export function RevenueByPeriodSection({ summary }: RevenueByPeriodSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Monthly Revenue</CardTitle>
        <CardDescription className="text-sm">
          Completed membership transactions grouped by calendar month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Completed transactions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.revenueByPeriod.map((row) => (
              <TableRow key={row.period}>
                <TableCell className="font-medium">{row.period}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number.parseFloat(row.revenue))}
                </TableCell>
                <TableCell className="text-right">{row.transactionCount}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(Number.parseFloat(summary.totals.revenue))}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {summary.totals.completedTransactionCount}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
