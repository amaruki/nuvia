import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Invoice, InvoiceStatistics } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface AnalyticsTabProps {
  invoices: Invoice[];
  statistics: InvoiceStatistics | null;
}

export function AnalyticsTab({ invoices, statistics }: AnalyticsTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Client Breakdown */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Top Clients</CardTitle>
            <CardDescription className="text-sm">Clients by invoice volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.clientBreakdown
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .slice(0, 5)
                .map((client) => (
                  <div key={client.clientId} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-sm font-medium truncate">{client.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.invoiceCount} invoices
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{formatCurrency(client.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(client.paidAmount)} collected
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Status Breakdown</CardTitle>
          <CardDescription className="text-sm">Invoices by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { status: "draft", count: invoices.filter((i) => i.status === "draft").length },
              { status: "sent", count: invoices.filter((i) => i.status === "sent").length },
              { status: "paid", count: invoices.filter((i) => i.status === "paid").length },
              {
                status: "overdue",
                count: invoices.filter((i) => i.status === "overdue").length,
              },
              {
                status: "cancelled",
                count: invoices.filter((i) => i.status === "cancelled").length,
              },
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">{item.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{item.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(
                      invoices
                        .filter((i) => i.status === item.status)
                        .reduce((sum, i) => sum + i.totalAmount, 0),
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
