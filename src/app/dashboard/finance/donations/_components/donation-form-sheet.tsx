"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  FormActions,
  FormSection,
  FormSheet,
  type FormSheetState,
} from "@/components/dashboard/form-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApiClientError } from "@/lib/api-client";
import { useDonationQuery } from "@/lib/hooks/use-finance-donations/use-donation-queries";
import type {
  DonationCreatePayload,
  DonationUpdatePayload,
} from "@/lib/hooks/use-finance-donations/types";
import { donationCreateSchema } from "@/lib/validation/donation.validation";
import type { Donation } from "@/types/finance";
import type { z } from "zod";

import { DonationDetailsSection } from "./donation-details-section";
import { DonorSection } from "./donor-section";
import { StatusNotesSection } from "./status-notes-section";

type DonationFormValues = z.infer<typeof donationCreateSchema>;
/** Input shape (defaults not yet applied) — the form's field value type. */
type DonationFormInput = z.input<typeof donationCreateSchema>;

const FORM_ID = "donation-form";

function toFormValues(donation: Donation | null): DonationFormValues {
  if (!donation) {
    return {
      donorName: "",
      donorEmail: "",
      donorType: "individual",
      donationType: "one_time",
      campaign: "",
      amount: "",
      currency: "USD",
      status: "pending",
      donationDate: "",
      receiptSent: false,
      notes: "",
    };
  }
  return {
    donorName: donation.donorName,
    donorEmail: donation.donorEmail,
    donorType: donation.donorType,
    donationType: donation.donationType,
    campaign: donation.campaign ?? "",
    amount: donation.amount.toFixed(2),
    currency: donation.currency,
    status: donation.status,
    donationDate: format(donation.donationDate, "yyyy-MM-dd"),
    receiptSent: donation.receiptSent,
    notes: donation.notes ?? "",
  };
}

export interface DonationFormSheetProps {
  sheet: FormSheetState;
  onCreate: (input: DonationCreatePayload) => Promise<void>;
  onUpdate: (id: string, input: DonationUpdatePayload) => Promise<void>;
}

/**
 * URL-driven record/edit sheet for donations (CODING_STANDARD §4.4).
 * `?form=new` records a donation; `?form=<id>` loads the donation via the
 * GET endpoint and seeds the form. In edit mode donor identity and the
 * money record are disabled — the PATCH endpoint only accepts
 * status/notes/receiptSent/campaign, and money history is corrected by new
 * rows (refunds), not rewritten.
 */
export function DonationFormSheet({ sheet, onCreate, onUpdate }: DonationFormSheetProps) {
  const isEdit = sheet.mode === "edit";
  const {
    data: editingDonation,
    isPending,
    isError,
  } = useDonationQuery(sheet.mode === "edit" ? sheet.editId : null);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<DonationFormInput, unknown, DonationFormValues>({
    resolver: zodResolver(donationCreateSchema),
    defaultValues: toFormValues(null),
  });

  // Seed (or re-seed) the form every time the sheet opens or the edit
  // target changes; defaultValues alone would keep stale input across
  // open/close cycles.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    if (sheet.mode === "edit" && !editingDonation) return;
    form.reset(toFormValues(sheet.mode === "edit" ? (editingDonation ?? null) : null));
    setSubmitError(null);
  }, [sheet.mode, sheet.editId, editingDonation, form]);

  const onSubmit = async (values: DonationFormValues) => {
    setSubmitError(null);
    try {
      if (isEdit && sheet.editId) {
        await onUpdate(sheet.editId, {
          status: values.status,
          campaign: values.campaign?.trim() ? values.campaign.trim() : null,
          notes: values.notes?.trim() ? values.notes.trim() : null,
        });
        toast.success("Donation updated");
      } else {
        await onCreate({
          donorName: values.donorName,
          donorEmail: values.donorEmail,
          donorType: values.donorType,
          donationType: values.donationType,
          campaign: values.campaign?.trim() || undefined,
          amount: values.amount,
          currency: values.currency,
          status: values.status,
          donationDate: values.donationDate || undefined,
          notes: values.notes?.trim() || undefined,
        });
        toast.success("Donation recorded");
      }
      sheet.close();
    } catch (error) {
      setSubmitError(
        error instanceof ApiClientError ? error.message : "Failed to save the donation.",
      );
    }
  };

  const { isDirty, isSubmitting } = form.formState;

  return (
    <FormSheet
      open={sheet.open}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title={isEdit ? "Edit donation" : "Record donation"}
      description={
        isEdit
          ? "Update the campaign, status and notes. Donor identity and the amount are immutable once recorded."
          : "Record a gift received by the organization."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        !isEdit || editingDonation ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Donation"
          />
        ) : undefined
      }
    >
      {isEdit && (isPending || isError) ? (
        <div className="space-y-6 p-6">
          {isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              Loading donation...
            </div>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertDescription>
                  This donation could not be loaded. It may have been removed. Close the sheet and
                  refresh the list.
                </AlertDescription>
              </Alert>
              <Button type="button" variant="outline" onClick={sheet.close}>
                Close
              </Button>
            </>
          )}
        </div>
      ) : (
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-6 p-6"
          >
            {submitError ? (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <FormSection
              title="Donor"
              description={isEdit ? "Donor identity is immutable once recorded." : undefined}
            >
              <DonorSection disabled={isEdit} />
            </FormSection>
            <FormSection
              title="Donation"
              description={
                isEdit ? "Amount, currency and date are immutable once recorded." : undefined
              }
            >
              <DonationDetailsSection disabled={isEdit} />
            </FormSection>
            <FormSection title="Status and notes">
              <StatusNotesSection />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
