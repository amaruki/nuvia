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

interface RevenueByTierSectionProps {
  summary: FinanceReportSummary;
}

export function RevenueByTierSection({ summary }: RevenueByTierSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Revenue by Membership Tier</CardTitle>
        <CardDescription className="text-sm">
          Completed transactions grouped by the tier they were billed for
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summary.revenueByTier.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No completed transactions in the last {summary.months} months.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Completed transactions</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.revenueByTier.map((row) => {
                const total = Number.parseFloat(summary.totals.revenue);
                const share = total > 0 ? (Number.parseFloat(row.revenue) / total) * 100 : 0;
                return (
                  <TableRow key={row.tierId}>
                    <TableCell className="font-medium">{row.tierName}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number.parseFloat(row.revenue))}
                    </TableCell>
                    <TableCell className="text-right">{row.transactionCount}</TableCell>
                    <TableCell className="text-right">{share.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
