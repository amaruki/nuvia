"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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
import { jobPostingSchema, type JobPostingFormValues } from "@/lib/validation/job.validation";
import type { JobPostingDto } from "@/types/jobs.types";

import {
  fetchJobBoardMeta,
  fetchJobPosting,
  type JobPostingCreateInput,
  type JobPostingUpdateInput,
} from "../_lib/jobs-api";
import { BasicInfoSection } from "./job-form/basic-info-section";
import { ClassificationSection } from "./job-form/classification-section";
import { DescriptionSection } from "./job-form/description-section";
import { buildPayload, toFormState } from "./job-form/helpers";
import { SalarySection } from "./job-form/salary-section";
import { SettingsSection } from "./job-form/settings-section";
import { StatusSection } from "./job-form/status-section";

const FORM_ID = "job-form";

export interface JobFormSheetProps {
  sheet: FormSheetState;
  onCreate: (input: JobPostingCreateInput) => Promise<JobPostingDto>;
  onUpdate: (id: string, input: JobPostingUpdateInput) => Promise<JobPostingDto>;
}

/**
 * URL-driven create/edit sheet for job postings (CODING_STANDARD
 * "Dashboard forms"). The sheet opens on ?form=new / ?form=<id> and shares
 * one form component for both modes.
 */
export function JobFormSheet({ sheet, onCreate, onUpdate }: JobFormSheetProps) {
  const isEdit = sheet.mode === "edit";
  const editId = isEdit ? sheet.editId : null;

  const {
    data: meta,
    isLoading: metaLoading,
    error: metaError,
  } = useQuery({
    queryKey: ["jobs-meta"],
    queryFn: fetchJobBoardMeta,
    enabled: sheet.open,
  });

  const {
    data: job,
    isLoading: jobLoading,
    error: jobError,
  } = useQuery({
    queryKey: ["job", editId],
    queryFn: () => fetchJobPosting(editId ?? ""),
    enabled: Boolean(editId),
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: toFormState(),
  });

  // Seed (or re-seed) the form every time the sheet opens or the edit
  // target arrives; defaultValues alone would keep stale input across
  // open/close cycles.
  useEffect(() => {
    if (!sheet.open) return;
    if (isEdit && !job) return;
    form.reset(toFormState(job));
    setSubmitError(null);
  }, [sheet.open, isEdit, job, form]);

  const onSubmit = async (values: JobPostingFormValues) => {
    setSubmitError(null);
    const payload = buildPayload(values);
    try {
      if (isEdit && job) {
        await onUpdate(job.id, payload);
        toast.success("Job updated");
      } else {
        await onCreate(payload);
        toast.success("Job created");
      }
      sheet.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save the job posting.";
      setSubmitError(message);
    }
  };

  const { isDirty, isSubmitting } = form.formState;

  const queryError = metaError ?? (isEdit ? jobError : null);
  const loading = metaLoading || (isEdit && jobLoading);
  const notFound = isEdit && !jobLoading && !jobError && !job;
  const formReady = !queryError && !loading && !notFound && Boolean(meta);

  return (
    <FormSheet
      open={sheet.open}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title={isEdit ? "Edit job" : "Post a new job"}
      description={
        isEdit
          ? "Update the job details and status below."
          : "Create a new job posting for the careers page."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        formReady ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Job"
          />
        ) : undefined
      }
    >
      {queryError ? (
        <div className="space-y-6 p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {queryError instanceof Error ? queryError.message : "Failed to load the job form."}
            </AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={sheet.close}>
            Close
          </Button>
        </div>
      ) : notFound ? (
        <div className="space-y-6 p-6">
          <Alert variant="destructive">
            <AlertDescription>
              This job posting no longer exists. Close the sheet and refresh the list.
            </AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={sheet.close}>
            Close
          </Button>
        </div>
      ) : loading || !meta ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          Loading job form...
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
              <BasicInfoSection meta={meta} />
            </FormSection>
            <FormSection title="Classification">
              <ClassificationSection />
            </FormSection>
            <FormSection
              title="Compensation"
              description="Leave both salaries empty to list the role without disclosing a range."
            >
              <SalarySection />
            </FormSection>
            <FormSection title="Status and deadline">
              <StatusSection />
            </FormSection>
            <FormSection title="Settings">
              <SettingsSection />
            </FormSection>
            <FormSection title="Description">
              <DescriptionSection />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
