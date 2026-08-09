"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DuesOverviewCards } from "@/components/finance/dues-overview-cards";
import { DuesTable } from "@/components/finance/dues-table";
import { DuesFilters } from "@/components/finance/dues-filters";
import { useFinanceDues } from "@/lib/hooks/use-finance-dues";
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
        totalDues={dues.length}
        overdueCount={statistics?.overdueCount}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refreshData}
      />

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
            <RecentDuesCard dues={dues} />

            {/* Upcoming Dues */}
            <UpcomingDuesCard dues={dues} />
          </div>

          {/* Collection Trend */}
          {statistics && <CollectionTrendCard statistics={statistics} />}
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
          <RecentPaymentsCard payments={payments} />
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <ReminderHistoryCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
