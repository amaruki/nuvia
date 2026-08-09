"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api-client";
import type { FinanceReportSummary } from "@/lib/hooks/use-finance-reports";
import { formatCurrency, type OpenInvoiceRow } from "./helpers";

interface OutstandingReceivablesSectionProps {
  summary: FinanceReportSummary;
}

export function OutstandingReceivablesSection({ summary }: OutstandingReceivablesSectionProps) {
  // Mounted only when the receivables report is selected, so the query needs
  // no `enabled` guard.
  const receivablesQuery = useQuery({
    queryKey: ["finance", "open-receivables"],
    queryFn: async () => {
      const [sent, overdue] = await Promise.all([
        apiFetch<{ rows: OpenInvoiceRow[] }>(
          "/api/v1/finance/reports/invoices?status=sent&limit=100",
        ),
        apiFetch<{ rows: OpenInvoiceRow[] }>(
          "/api/v1/finance/reports/invoices?status=overdue&limit=100",
        ),
      ]);
      return [...overdue.data.rows, ...sent.data.rows];
    },
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm">Open invoices</CardDescription>
            <CardTitle className="text-2xl">{summary.outstanding.invoiceCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm">Outstanding amount</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(Number.parseFloat(summary.outstanding.outstandingAmount))}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm">Overdue invoices</CardDescription>
            <CardTitle className="text-2xl">{summary.outstanding.overdueCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm">Overdue amount</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(Number.parseFloat(summary.outstanding.overdueAmount))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Open Invoices</CardTitle>
          <CardDescription className="text-sm">
            Issued invoices that are not yet paid or voided, overdue first
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receivablesQuery.isPending ? (
            <div className="h-32 bg-muted rounded animate-pulse"></div>
          ) : (receivablesQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No open invoices — everything issued has been paid or voided.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(receivablesQuery.data ?? []).map((row) => (
                  <TableRow key={row.invoiceId}>
                    <TableCell className="font-medium">
                      {row.invoiceNumber ?? row.invoiceId.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{row.memberName ?? "Unknown member"}</p>
                      <p className="text-xs text-muted-foreground">{row.memberEmail}</p>
                    </TableCell>
                    <TableCell>{row.tierName ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number.parseFloat(row.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number.parseFloat(row.paid))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number.parseFloat(row.balance))}
                    </TableCell>
                    <TableCell>
                      {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === "overdue" ? "destructive" : "secondary"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
