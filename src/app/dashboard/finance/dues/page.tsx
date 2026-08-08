"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertTriangle, Download, TrendingUp } from "lucide-react";

import { DuesOverviewCards } from "@/components/finance/dues-overview-cards";
import { DuesTable } from "@/components/finance/dues-table";
import { DuesFilters } from "@/components/finance/dues-filters";
import { useFinanceDues } from "@/lib/hooks/use-finance-dues";
import { useHeader } from "@/contexts/dashboard-context";

export default function FinanceDues() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const { setHeader, clearHeader } = useHeader();

  const {
    dues,
    payments,
    statistics,
    loading,
    error,
    filters,
    updateDueStatus,
    recordPayment,
    sendReminder,
    refreshData,
    updateFilters,
    clearFilters,
  } = useFinanceDues();

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
      title: "Member Dues",
      description: "Manage membership fee collection, payment tracking, and reminders",
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
      {statistics && <DuesOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {dues.length} dues total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.overdueCount} overdue
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <DuesFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dues">All Dues</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Dues */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Dues</CardTitle>
                <CardDescription>Latest membership dues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dues.slice(0, 5).map((due) => (
                    <div key={due.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{due.memberName}</p>
                        <p className="text-xs text-muted-foreground">
                          {due.membershipTier} • Due {new Date(due.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(due.balanceAmount)}</p>
                        <Badge
                          variant={
                            due.status === "paid"
                              ? "default"
                              : due.status === "overdue"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {due.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Dues */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Dues</CardTitle>
                <CardDescription>Dues due in the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dues
                    .filter(
                      (due) =>
                        due.status === "pending" &&
                        new Date(due.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    )
                    .slice(0, 5)
                    .map((due) => (
                      <div key={due.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{due.memberName}</p>
                          <p className="text-xs text-muted-foreground">{due.membershipTier}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(due.dueAmount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(due.dueDate).toLocaleDateString()}
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
                <CardTitle>Collection Trend</CardTitle>
                <CardDescription>Monthly collection performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.monthlyTrend.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{month.month}</span>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-right">
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

        <TabsContent value="dues" className="space-y-6">
          <DuesTable
            dues={dues}
            payments={payments}
            onRecordPayment={recordPayment}
            onSendReminder={sendReminder}
            onUpdateStatus={updateDueStatus}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{payment.paymentMethod}</p>
                      <p className="text-xs text-muted-foreground">{payment.transactionId}</p>
                    </div>
                    <div className="text-right">
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

        <TabsContent value="reminders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reminder History</CardTitle>
              <CardDescription>Sent and scheduled reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-dashed p-6 text-center">
                <p className="text-sm font-medium">No reminders are tracked yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The membership schema has no reminders store. Sending a reminder from the dues
                  table reports this honestly instead of recording anything.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
