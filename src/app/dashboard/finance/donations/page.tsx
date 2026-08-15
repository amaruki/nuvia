"use client";

import { useEffect, useState } from "react";

import { useFormSheet } from "@/components/dashboard/form-sheet";
import { PageErrorState, PageLoadingState } from "@/components/dashboard/page-states";
import { DonationDetailsModal } from "@/components/finance/donation-details-modal";
import { DonationsOverviewCards } from "@/components/finance/donations-overview-cards";
import { DonationsTable } from "@/components/finance/donations-table";
import { useHeader } from "@/contexts/dashboard-context";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useFinanceDonations } from "@/lib/hooks/use-finance-donations";
import type { Donation } from "@/types/finance";

import { DonationFormSheet } from "./_components/donation-form-sheet";
import { DonationsActionBar } from "./_components/donations-action-bar";

/**
 * Donations & Fundraising dashboard, backed by the real donations store
 * (src/db/schema/donations.ts). The table paginates server-side over
 * GET /api/v1/finance/donations; the overview cards compute from a bounded
 * window of the newest rows (see STATISTICS_WINDOW_LIMIT). Recording and
 * editing open the URL-driven form sheet (?form=new / ?form=<id>); row
 * clicks open the details modal. Campaigns and donation payments are not
 * stored yet — the surfaces say so instead of mocking them.
 */
export default function FinanceDonations() {
  const { setHeader, clearHeader } = useHeader();

  // URL-synced table state (sort/search/page) shared with the table.
  const tableState = useDataTableState({ defaultPageSize: 20 });

  // URL-driven record/edit sheet open state (?form=new / ?form=<id>).
  const sheet = useFormSheet();

  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    donations,
    total,
    totalPages,
    statistics,
    loading,
    fetching,
    error,
    createDonation,
    updateDonation,
    updateDonationStatus,
    refreshData,
  } = useFinanceDonations({
    page: tableState.state.page,
    pageSize: tableState.state.pageSize,
  });

  useEffect(() => {
    setHeader({
      title: "Donations & Fundraising",
      description: "Manage donations, campaigns, and fundraising activities",
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
      <DonationsOverviewCards statistics={statistics} />

      <DonationsActionBar totalItems={total} onRecord={sheet.openCreate} onRefresh={refreshData} />

      <DonationsTable
        donations={donations}
        total={total}
        totalPages={totalPages}
        loading={fetching}
        onViewDetails={(donation) => {
          setSelectedDonation(donation);
          setDetailsOpen(true);
        }}
        onEdit={(donation) => sheet.openEdit(donation.id)}
        onUpdateStatus={updateDonationStatus}
        onRefresh={refreshData}
        tableState={tableState}
      />

      <DonationFormSheet sheet={sheet} onCreate={createDonation} onUpdate={updateDonation} />

      <DonationDetailsModal
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedDonation(null);
        }}
        donation={selectedDonation}
        /*
         * No donation payments store exists yet, so the modal always
         * receives an empty payment list and its payment-history section
         * renders its empty state (stated, not silent).
         */
        payments={[]}
        onUpdateStatus={updateDonationStatus}
      />
    </div>
  );
}
