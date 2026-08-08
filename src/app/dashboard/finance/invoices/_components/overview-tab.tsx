import { TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Invoice, InvoiceStatistics } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface OverviewTabProps {
  invoices: Invoice[];
  statistics: InvoiceStatistics | null;
}

export function OverviewTab({ invoices, statistics }: OverviewTabProps) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Recent Invoices</CardTitle>
            <CardDescription className="text-sm">Latest client invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-sm font-medium truncate">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{invoice.clientName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{formatCurrency(invoice.totalAmount)}</p>
                    <Badge
                      variant={
                        invoice.status === "paid"
                          ? "default"
                          : invoice.status === "overdue"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Due */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Upcoming Due</CardTitle>
            <CardDescription className="text-sm">Invoices due in next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices
                .filter(
                  (invoice) =>
                    invoice.status === "sent" &&
                    new Date(invoice.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                )
                .slice(0, 5)
                .map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-sm font-medium truncate">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{invoice.clientName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{formatCurrency(invoice.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Trend */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Collection Trend</CardTitle>
            <CardDescription className="text-sm">Monthly collection performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.monthlyTrend.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{month.month}</span>
                    <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{formatCurrency(month.collected)}</p>
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(month.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
