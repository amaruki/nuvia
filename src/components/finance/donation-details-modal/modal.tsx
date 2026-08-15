"use client";

import { Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { DonationDetailsModalProps } from "./types";
import DonorInfoSection from "./donor-info-section";
import DetailsSection from "./details-section";
import PaymentHistorySection from "./payment-history-section";
import DonationActions from "./actions";

export function DonationDetailsModal({
  donation,
  payments,
  open,
  onOpenChange,
  onUpdateStatus,
}: DonationDetailsModalProps) {
  if (!donation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 shrink-0" />
            Donation Details
          </DialogTitle>
          <DialogDescription>View detailed information about this donation</DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-6">
          <DonorInfoSection donation={donation} />

          <Separator />

          <DetailsSection donation={donation} />

          <Separator />

          <PaymentHistorySection donationId={donation.id} payments={payments} />

          <DonationActions
            donation={donation}
            onUpdateStatus={onUpdateStatus}
            onOpenChange={onOpenChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
