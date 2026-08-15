"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useFinanceInvoices } from "@/lib/hooks/use-finance-invoices";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useHeader } from "@/contexts/dashboard-context";
import { InvoicesOverviewCards } from "@/components/finance/invoices-overview-cards";
import { InvoicesTable } from "@/components/finance/invoices-table";
import { PageErrorState, PageLoadingState } from "@/components/dashboard/page-states";
import { ActionBar } from "./_components/action-bar";
import { AnalyticsTab } from "./_components/analytics-tab";
import { OverviewTab } from "./_components/overview-tab";
import { PaymentsTab } from "./_components/payments-tab";

export default function FinanceInvoices() {
  const [activeTab, setActiveTab] = useState("overview");
  const { setHeader, clearHeader } = useHeader();

  // URL-synced table state (sort/search/page) shared with the table.
  const tableState = useDataTableState({ defaultPageSize: 20 });

  const {
    invoices,
    total,
    totalPages,
    statisticsRows,
    payments,
    statistics,
    loading,
    fetching,
    error,
    recordPayment,
    sendInvoice,
    sendReminder,
    refreshData,
  } = useFinanceInvoices({
    page: tableState.state.page,
    pageSize: tableState.state.pageSize,
  });

  useEffect(() => {
    setHeader({
      title: "Invoices & Billing",
      description: "Manage client invoices, billing, and payment processing",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  // Clamp a stale ?page= param after the list shrinks.
  useEffect(() => {
    if (totalPages > 0 && tableState.state.page > totalPages) {
      tableState.setPage(totalPages);
    }
  }, [totalPages, tableState.state.page, tableState]);

  if (loading) {
    return <PageLoadingState />;
  }

  if (error) {
    return <PageErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <InvoicesOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <ActionBar totalItems={total} statistics={statistics} onRefresh={refreshData} />

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
          <OverviewTab invoices={statisticsRows} statistics={statistics} />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoicesTable
            invoices={invoices}
            total={total}
            totalPages={totalPages}
            payments={payments}
            loading={fetching}
            onRecordPayment={recordPayment}
            onSendInvoice={sendInvoice}
            onSendReminder={sendReminder}
            onRefresh={refreshData}
            tableState={tableState}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentsTab payments={payments} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab invoices={statisticsRows} statistics={statistics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
