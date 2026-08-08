"use client";

/**
 * C4: detail view for one computed finance report. The report id selects a
 * live aggregate (see use-finance-reports): revenue by month, revenue by
 * tier, or outstanding receivables. Everything is rendered from the report
 * summary API — there are no stored report documents, journal entries or
 * review workflows.
 */

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { REPORT_IDS, useFinanceReports } from "@/lib/hooks/use-finance-reports";
import { useHeader } from "@/contexts/dashboard-context";

interface OpenInvoiceRow {
  invoiceId: string;
  invoiceNumber: string | null;
  memberName: string | null;
  memberEmail: string | null;
  tierName: string | null;
  amount: string;
  paid: string;
  balance: string;
  dueDate: string | null;
  status: "sent" | "overdue";
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export default function FinanceReportDetail() {
  const params = useParams<{ id: string }>();
  const reportId = params.id;
  const { setHeader, clearHeader } = useHeader();
  const { reports, summary, loading, error, downloadReport, refreshData } = useFinanceReports();

  const receivablesQuery = useQuery({
    queryKey: ["finance", "open-receivables"],
    enabled: reportId === REPORT_IDS.outstandingReceivables,
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

  const report = reports.find((candidate) => candidate.id === reportId);

  useEffect(() => {
    setHeader({
      title: report?.title ?? "Financial Report",
      description: report?.description ?? "Computed from the membership ledger",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader, report?.title, report?.description]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-5 bg-muted rounded w-48 mb-2"></div>
            <div className="h-3 bg-muted rounded w-96 max-w-full"></div>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button onClick={refreshData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!report || !summary) {
    return (
      <div className="space-y-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard/finance/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to reports
          </Link>
        </Button>
        <Alert>
          <AlertDescription>
            No report with this identifier exists. Reports are computed live — see the reports list
            for what is available.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/finance/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to reports
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recompute
          </Button>
          <Button size="sm" onClick={() => downloadReport(report)}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{report.type.replace("_", " ")}</Badge>
            <Badge variant="secondary">{report.period}</Badge>
            <Badge variant="default">{report.status}</Badge>
          </div>
          <CardTitle className="text-base sm:text-lg">{report.title}</CardTitle>
          <CardDescription className="text-sm">{report.description}</CardDescription>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(report.generatedAt).toLocaleString()} by {report.generatedBy}
          </p>
        </CardHeader>
      </Card>

      {report.id === REPORT_IDS.revenueByPeriod && (
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
      )}

      {report.id === REPORT_IDS.revenueByTier && (
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
      )}

      {report.id === REPORT_IDS.outstandingReceivables && (
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
      )}
    </div>
  );
}
