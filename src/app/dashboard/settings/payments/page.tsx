/**
 * UI-23 — settings/payments: the honest payments picture for the signed-in
 * member and the deployment.
 *
 * Server shell per ADR-0006. No forms here: this deployment stores no
 * cards, so there is no card-management surface to fake. Billing history
 * comes from the member's own membership invoices (the same store that
 * /dashboard/my/finance reads); the gateway section mirrors what
 * GET /api/v1/finance/gateways serves and is gated on finance:read the
 * same way.
 */

import Link from "next/link";
import { ArrowRight, CreditCard, ReceiptText, Server } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/utils/session";
import { hasPermission } from "@/lib/rbac";
import { getMemberFinanceSummary, listMemberInvoices } from "@/lib/services/finance";
import { describeConfiguredGateway } from "@/lib/services/finance-report";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatMoney } from "./_components/format";

// Reads the session user, their invoices, and the gateway at request time.
export const dynamic = "force-dynamic";

export default async function SettingsPaymentsPage() {
  const user = await getCurrentUser();

  const [summary, invoiceResult, canReadGateways] = await Promise.all([
    getMemberFinanceSummary(user?.id ?? ""),
    listMemberInvoices(user?.id ?? "", { limit: 5 }),
    hasPermission("finance:read"),
  ]);
  const gateway = canReadGateways ? describeConfiguredGateway() : null;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Payments settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            Your membership billing
          </CardTitle>
          <CardDescription>
            Your own invoices and payments — the same records shown on your finance page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Outstanding balance</dt>
              <dd className="text-2xl font-semibold">{formatMoney(summary.outstandingBalance)}</dd>
              <dd className="text-xs text-muted-foreground">
                {summary.outstandingInvoiceCount} open invoice
                {summary.outstandingInvoiceCount === 1 ? "" : "s"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Total paid</dt>
              <dd className="text-2xl font-semibold">{formatMoney(summary.totalPaid)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Invoices</dt>
              <dd className="text-2xl font-semibold">
                {summary.invoiceCounts.issued +
                  summary.invoiceCounts.paid +
                  summary.invoiceCounts.void}
              </dd>
              <dd className="text-xs text-muted-foreground">
                {summary.invoiceCounts.paid} paid · {summary.invoiceCounts.void} void
              </dd>
            </div>
          </dl>

          {invoiceResult.invoices.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent invoices</p>
                {invoiceResult.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                      <span className="ml-2 text-muted-foreground">{invoice.tierName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{formatDate(invoice.dueDate)}</span>
                      <Badge
                        variant={
                          invoice.status === "PAID"
                            ? "default"
                            : invoice.status === "ISSUED"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {invoice.status.toLowerCase()}
                      </Badge>
                      <span className="font-medium">
                        {formatMoney(invoice.totalAmount, invoice.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Link
            href="/dashboard/my/finance"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            View all invoices and pay now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      {gateway && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Payment gateway on this deployment
            </CardTitle>
            <CardDescription>
              How this site collects payments. The gateway is selected with the PAYMENT_GATEWAY
              environment variable at deploy time — it is not configurable in the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-medium">{gateway.displayName}</span>
              <Badge variant={gateway.status === "active" ? "default" : "secondary"}>
                {gateway.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{gateway.description}</p>
            <Separator />
            <dl className="grid gap-2 text-sm">
              {gateway.provider === "stripe" && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Stripe secret key configured</dt>
                    <dd className="font-medium">{gateway.secretKeyConfigured ? "Yes" : "No"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Webhook secret configured</dt>
                    <dd className="font-medium">
                      {gateway.webhookSecretConfigured ? "Yes" : "No"}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Webhook endpoint</dt>
                <dd className="font-mono text-xs">{gateway.webhookEndpoint ?? "None"}</dd>
              </div>
            </dl>
            <Separator />
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This deployment does not store card details. Online payments run through Stripe
                Checkout; there is no card vault or subscription management to configure.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
