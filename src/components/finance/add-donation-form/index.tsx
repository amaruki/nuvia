"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import type { DonationFormData } from "@/types/finance";
import { logger } from "@/lib/logger";
import type { AddDonationFormProps, DonorInfo } from "./types";
import { DonorInfoSection } from "./donor-info-section";
import { DonationDetailsSection } from "./donation-details-section";
import { SummarySection } from "./summary-section";
import { InfoBox } from "./info-box";
import { FormActions } from "./form-actions";

export function AddDonationForm({ open, onOpenChange, onSubmit, campaigns }: AddDonationFormProps) {
  const [formData, setFormData] = useState<DonationFormData>({
    donorId: "",
    donorType: "individual",
    donationType: "one_time",
    campaign: "",
    amount: 0,
    currency: "USD",
    notes: "",
  });

  const [donorInfo, setDonorInfo] = useState<DonorInfo>({
    name: "",
    email: "",
  });

  const [sendReceipt, setSendReceipt] = useState(true);
  const [sendThankYou, setSendThankYou] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        donorId: "",
        donorType: "individual",
        donationType: "one_time",
        campaign: "",
        amount: 0,
        currency: "USD",
        notes: "",
      });
      setDonorInfo({ name: "", email: "" });
      setSendReceipt(true);
      setSendThankYou(true);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Generate a simple donor ID based on email or name
    const donorId = donorInfo.email || donorInfo.name || `donor-${Date.now()}`;

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        donorId,
        sendReceipt,
        sendThankYou,
      });

      // Reset form
      setFormData({
        donorId: "",
        donorType: "individual",
        donationType: "one_time",
        campaign: "",
        amount: 0,
        currency: "USD",
        notes: "",
      });
      setDonorInfo({ name: "", email: "" });
      onOpenChange(false);
    } catch (error) {
      logger.error("Error adding donation", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 shrink-0" />
            Add New Donation
          </DialogTitle>
          <DialogDescription>Record a new donation or pledge</DialogDescription>
        </DialogHeader>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6">
          <DonorInfoSection
            formData={formData}
            setFormData={setFormData}
            donorInfo={donorInfo}
            setDonorInfo={setDonorInfo}
          />

          <Separator />

          <DonationDetailsSection
            formData={formData}
            setFormData={setFormData}
            campaigns={campaigns}
          />

          {/* Summary */}
          {formData.amount > 0 && (
            <>
              <Separator />
              <SummarySection formData={formData} />
            </>
          )}

          <InfoBox donationType={formData.donationType} />

          <FormActions
            formData={formData}
            donorInfo={donorInfo}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
