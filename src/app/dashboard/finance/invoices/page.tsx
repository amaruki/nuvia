"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useFinanceInvoices } from "@/lib/hooks/use-finance-invoices";
import { useHeader } from "@/contexts/dashboard-context";
import { InvoicesFilters } from "@/components/finance/invoices-filters";
import { InvoicesOverviewCards } from "@/components/finance/invoices-overview-cards";
import { InvoicesTable } from "@/components/finance/invoices-table";
import { ActionBar } from "./_components/action-bar";
import { AnalyticsTab } from "./_components/analytics-tab";
import { OverviewTab } from "./_components/overview-tab";
import { ErrorState, LoadingState } from "./_components/page-states";
import { PaymentsTab } from "./_components/payments-tab";

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
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <InvoicesOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <ActionBar
        totalItems={invoices.length}
        statistics={statistics}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refreshData}
      />

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
          <OverviewTab invoices={invoices} statistics={statistics} />
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
          <PaymentsTab payments={payments} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab invoices={invoices} statistics={statistics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
