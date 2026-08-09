"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DuesOverviewCards } from "@/components/finance/dues-overview-cards";
import { DuesTable } from "@/components/finance/dues-table";
import { useFinanceDues } from "@/lib/hooks/use-finance-dues";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useHeader } from "@/contexts/dashboard-context";
import { CollectionTrendCard } from "./_components/collection-trend-card";
import { DuesActionBar } from "./_components/dues-action-bar";
import { DuesErrorState, DuesLoadingState } from "./_components/page-states";
import { RecentDuesCard } from "./_components/recent-dues-card";
import { RecentPaymentsCard } from "./_components/recent-payments-card";
import { ReminderHistoryCard } from "./_components/reminder-history-card";
import { UpcomingDuesCard } from "./_components/upcoming-dues-card";

export default function FinanceDues() {
  const [activeTab, setActiveTab] = useState("overview");
  const { setHeader, clearHeader } = useHeader();

  // URL-synced table state (sort/search/page) shared with the table.
  const tableState = useDataTableState({ defaultPageSize: 20 });

  const {
    dues,
    total,
    totalPages,
    statisticsRows,
    payments,
    statistics,
    loading,
    fetching,
    error,
    updateDueStatus,
    recordPayment,
    sendReminder,
    refreshData,
  } = useFinanceDues({
    page: tableState.state.page,
    pageSize: tableState.state.pageSize,
  });

  useEffect(() => {
    setHeader({
      title: "Member Dues",
      description: "Manage membership fee collection, payment tracking, and reminders",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  // Clamp a stale ?page= param after the ledger shrinks.
  useEffect(() => {
    if (totalPages > 0 && tableState.state.page > totalPages) {
      tableState.setPage(totalPages);
    }
  }, [totalPages, tableState.state.page, tableState]);

  if (loading) {
    return <DuesLoadingState />;
  }

  if (error) {
    return <DuesErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <DuesOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <DuesActionBar
        totalDues={total}
        overdueCount={statistics?.overdueCount}
        onRefresh={refreshData}
      />

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
            <RecentDuesCard dues={statisticsRows} />

            {/* Upcoming Dues */}
            <UpcomingDuesCard dues={statisticsRows} />
          </div>

          {/* Collection Trend */}
          {statistics && <CollectionTrendCard statistics={statistics} />}
        </TabsContent>

        <TabsContent value="dues" className="space-y-6">
          <DuesTable
            dues={dues}
            total={total}
            totalPages={totalPages}
            payments={payments}
            loading={fetching}
            onRecordPayment={recordPayment}
            onSendReminder={sendReminder}
            onUpdateStatus={updateDueStatus}
            onRefresh={refreshData}
            tableState={tableState}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <RecentPaymentsCard payments={payments} />
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <ReminderHistoryCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
