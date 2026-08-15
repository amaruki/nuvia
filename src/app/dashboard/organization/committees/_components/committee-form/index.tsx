"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  FormActions,
  FormSection,
  FormSheet,
  type FormSheetState,
} from "@/components/dashboard/form-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useCommitteesQuery } from "@/lib/hooks/use-committees/use-committees-query";
import {
  committeeFormSchema,
  type CommitteeFormValues,
} from "@/lib/validation/organization.validation";
import type { Committee, CommitteeFormData } from "@/types/committee";

import { BasicInfoSection } from "./basic-info-section";
import { CharterSection } from "./charter-section";
import { ContactSection } from "./contact-section";

const FORM_ID = "committee-form";

export interface CommitteeFormSheetProps {
  sheet: FormSheetState;
  onCreate: (data: CommitteeFormData) => Promise<unknown>;
  onUpdate: (id: string, updates: Partial<CommitteeFormData>) => Promise<unknown>;
}

function toFormState(committee: Committee | null): CommitteeFormValues {
  return {
    name: committee?.name ?? "",
    displayName: committee?.displayName ?? "",
    description: committee?.description ?? "",
    purpose: committee?.purpose ?? "",
    status: committee?.status ?? "pending",
    type: committee?.type ?? "functional",
    contactInfo: {
      email: committee?.contactInfo.email ?? "",
      phone: committee?.contactInfo.phone ?? "",
      meetingLocation: committee?.contactInfo.meetingLocation ?? "",
      virtualMeetingLink: committee?.contactInfo.virtualMeetingLink ?? "",
      website: committee?.contactInfo.website ?? "",
    },
    charter: {
      missionStatement: committee?.charter.missionStatement ?? "",
      responsibilities: committee?.charter.responsibilities ?? [],
      authorityLevel: committee?.charter.authorityLevel ?? "operational",
      decisionMakingProcess: committee?.charter.decisionMakingProcess ?? "",
      reportingStructure: committee?.charter.reportingStructure ?? "",
      termLimits: committee?.charter.termLimits ?? { chairTerm: 24, memberTerm: 24, maxTerms: 2 },
    },
    parentCommitteeId: committee?.parentCommitteeId ?? "",
  };
}

/**
 * URL-driven create/edit sheet for committees (CODING_STANDARD "Dashboard
 * forms"). Opens on ?form=new / ?form=<id>; one form serves both modes.
 * Success/error toasts and query invalidation live in useCommitteeMutations.
 */
export function CommitteeFormSheet({ sheet, onCreate, onUpdate }: CommitteeFormSheetProps) {
  const { data: allCommittees = [] } = useCommitteesQuery({});
  const editingCommittee =
    sheet.mode === "edit" ? (allCommittees.find((item) => item.id === sheet.editId) ?? null) : null;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CommitteeFormValues>({
    resolver: zodResolver(committeeFormSchema),
    defaultValues: toFormState(null),
  });

  // Seed (or re-seed) the form every time the sheet opens or the edit
  // target changes; defaultValues alone would keep stale input across
  // open/close cycles.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    form.reset(toFormState(editingCommittee));
    setSubmitError(null);
  }, [sheet.mode, sheet.editId, editingCommittee, form]);

  const onSubmit = async (values: CommitteeFormValues) => {
    setSubmitError(null);
    try {
      if (editingCommittee) {
        await onUpdate(editingCommittee.id, values);
      } else {
        await onCreate(values);
      }
      sheet.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save the committee.";
      setSubmitError(message);
    }
  };

  const { isDirty, isSubmitting } = form.formState;
  const isEdit = sheet.mode === "edit";

  return (
    <FormSheet
      open={sheet.mode !== "closed"}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title={isEdit ? "Edit committee" : "Create committee"}
      description={
        isEdit
          ? "Update the committee information and charter details."
          : "Fill in the committee details and establish the charter."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        editingCommittee || !isEdit ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Committee"
          />
        ) : undefined
      }
    >
      {isEdit && !editingCommittee ? (
        <div className="space-y-6 p-6">
          <Alert variant="destructive">
            <AlertDescription>
              This committee no longer exists. Close the sheet and refresh the list.
            </AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={sheet.close}>
            Close
          </Button>
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

            <FormSection title="Basic information">
              <BasicInfoSection form={form} />
            </FormSection>
            <FormSection title="Contact information">
              <ContactSection />
            </FormSection>
            <FormSection title="Committee charter">
              <CharterSection form={form} />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
