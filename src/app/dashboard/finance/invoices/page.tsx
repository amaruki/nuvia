"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertTriangle, Download, TrendingUp, Plus } from "lucide-react";

import { InvoicesOverviewCards } from "@/components/finance/invoices-overview-cards";
import { InvoicesTable } from "@/components/finance/invoices-table";
import { InvoicesFilters } from "@/components/finance/invoices-filters";
import { useFinanceInvoices } from "@/lib/hooks/use-finance-invoices";
import { useHeader } from "@/contexts/dashboard-context";
import { toast } from "sonner";

export default function FinanceInvoices() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const { setHeader, clearHeader } = useHeader();

  const {
    invoices,
    payments,
    statistics,
    loading,
    error,
    filters,
    updateInvoiceStatus,
    recordPayment,
    sendInvoice,
    sendReminder,
    refreshData,
    updateFilters,
    clearFilters,
  } = useFinanceInvoices();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    setHeader({
      title: "Invoices & Billing",
      description: "Manage client invoices, billing, and payment processing",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <InvoicesOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {invoices.length} invoices total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.overdueCount} overdue
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none"
          >
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() =>
              toast.info(
                "Invoice creation bills one subscription — use the invoices API (POST /api/v1/finance/invoices) until the dashboard gains a subscription picker.",
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Create Invoice</span>
            <span className="sm:hidden">Create</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <InvoicesFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs sm:text-sm py-2 px-2">
            All Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm py-2 px-2">
            Payments
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                        <p className="text-xs text-muted-foreground truncate">
                          {invoice.clientName}
                        </p>
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
                        new Date(invoice.dueDate) <=
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    )
                    .slice(0, 5)
                    .map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="text-sm font-medium truncate">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {invoice.clientName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium">
                            {formatCurrency(invoice.totalAmount)}
                          </p>
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
                <CardDescription className="text-sm">
                  Monthly collection performance
                </CardDescription>
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
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoicesTable
            invoices={invoices}
            payments={payments}
            onRecordPayment={recordPayment}
            onSendReminder={sendReminder}
            onUpdateStatus={updateInvoiceStatus}
            onSendInvoice={sendInvoice}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Recent Payments</CardTitle>
              <CardDescription className="text-sm">Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-sm font-medium truncate">{payment.paymentMethod}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {payment.transactionId}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
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
                            <p className="text-sm font-medium">
                              {formatCurrency(client.totalAmount)}
                            </p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
