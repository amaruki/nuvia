/**
 * UI-34 — member finance: my dues, invoices & donations.
 *
 * Server component per ADR-0006 (same arrangement as UI-32's inbox):
 * session-gated, reads through the member-safe finance service — never the
 * finance:read-gated backoffice API. Own-only filtering happens inside the
 * service with the session user's id; projections are allow-lists.
 * Pay-now is a client island posting to /api/v1/finance/my/invoices/[id]/pay
 * (UI-33 gateway-adapter pattern); with PAYMENT_GATEWAY=manual the page
 * shows the honest offline-payment guidance instead of a fake checkout.
 *
 * Not in the nav sidebar by design this wave — MemberHome links here.
 */

import { redirect } from "next/navigation";
import { Info, ReceiptText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/utils/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MANUAL_PAY_GUIDANCE,
  getMemberFinanceSummary,
  listMemberInvoices,
  selectPayTrack,
  type MemberInvoiceDto,
} from "@/lib/services/finance";
import { FinanceHeader } from "./_components/finance-header";
import { PayNowButton } from "./_components/pay-now-button";
import { formatDate, formatMoney } from "./_components/format";

export const dynamic = "force-dynamic";

const STATUS_META: Record<
  MemberInvoiceDto["status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  ISSUED: { label: "Unpaid", variant: "default" },
  PAID: { label: "Paid", variant: "secondary" },
  VOID: { label: "Void", variant: "outline" },
};

export default async function MyFinancePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [summary, invoicePage] = await Promise.all([
    getMemberFinanceSummary(user.id),
    listMemberInvoices(user.id, { limit: 100 }),
  ]);
  const invoices = invoicePage.invoices;
  const track = selectPayTrack();

  return (
    <div className="max-w-5xl animate-fadeInUp space-y-6">
      <FinanceHeader />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold">{formatMoney(summary.outstandingBalance)}</p>
            <p className="text-xs text-muted-foreground">
              {summary.outstandingInvoiceCount} open invoice
              {summary.outstandingInvoiceCount === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatMoney(summary.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {summary.invoiceCounts.paid} paid / {summary.invoiceCounts.issued} open
            </p>
          </CardContent>
        </Card>
      </div>

      {track === "manual" && (
        <div className="flex gap-3 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <ul className="list-disc space-y-1 pl-4">
            {MANUAL_PAY_GUIDANCE.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="rounded-lg border bg-card py-16 text-center">
          <ReceiptText className="mx-auto mb-3 h-12 w-12 text-foreground/30" aria-hidden="true" />
          <h3 className="mb-1 font-medium text-foreground/80">No invoices yet</h3>
          <p className="text-sm text-muted-foreground">
            When membership dues are billed to you, the invoices will appear here.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invoice history</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const payable =
                    invoice.status === "ISSUED" && Number(invoice.outstandingAmount) > 0;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-muted-foreground">{invoice.tierName}</div>
                      </TableCell>
                      <TableCell>
                        <time dateTime={invoice.createdAt}>{formatDate(invoice.createdAt)}</time>
                      </TableCell>
                      <TableCell>
                        <time dateTime={invoice.dueDate ?? undefined}>
                          {formatDate(invoice.dueDate)}
                        </time>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(invoice.totalAmount, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(invoice.paidAmount, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(invoice.outstandingAmount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_META[invoice.status].variant}>
                          {STATUS_META[invoice.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{payable && <PayNowButton invoiceId={invoice.id} />}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
