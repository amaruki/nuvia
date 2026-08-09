"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form } from "@/components/ui/form";
import { jobPostingSchema, type JobPostingFormValues } from "@/lib/validation/job.validation";
import { createJobPosting, updateJobPosting } from "../../_lib/jobs-api";
import { buildPayload, toFormState } from "./helpers";
import type { JobFormProps } from "./types";
import { BasicInfoSection } from "./basic-info-section";
import { ClassificationSection } from "./classification-section";
import { SalarySection } from "./salary-section";
import { StatusSection } from "./status-section";
import { SettingsSection } from "./settings-section";
import { DescriptionSection } from "./description-section";

export function JobForm({ initialData, meta, mode }: JobFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: toFormState(initialData),
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (values: JobPostingFormValues) => {
    setError(null);

    try {
      const payload = buildPayload(values);
      if (mode === "create") {
        await createJobPosting(payload);
      } else if (initialData) {
        await updateJobPosting(initialData.id, payload);
      }
      router.push("/dashboard/jobs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the job posting");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Post a New Job" : "Edit Job Posting"}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Fill in the details below to create a new job posting."
              : "Update the job details below."}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <BasicInfoSection meta={meta} />
              <ClassificationSection />
              <SalarySection />
              <StatusSection />
              <SettingsSection />
              <DescriptionSection />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : mode === "create" ? "Create Job" : "Update Job"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
