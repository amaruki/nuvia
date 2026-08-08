"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createJobPosting, updateJobPosting } from "../../_lib/jobs-api";
import { buildPayload, toFormState } from "./helpers";
import type { JobFormProps, JobFormState } from "./types";
import { BasicInfoSection } from "./basic-info-section";
import { ClassificationSection } from "./classification-section";
import { SalarySection } from "./salary-section";
import { StatusSection } from "./status-section";
import { SettingsSection } from "./settings-section";
import { DescriptionSection } from "./description-section";

export function JobForm({ initialData, meta, mode }: JobFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobFormState>(() => toFormState(initialData));

  const setField = <K extends keyof JobFormState>(field: K, value: JobFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = buildPayload(formData);
      if (mode === "create") {
        await createJobPosting(payload);
      } else if (initialData) {
        await updateJobPosting(initialData.id, payload);
      }
      router.push("/dashboard/jobs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the job posting");
      setLoading(false);
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
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <BasicInfoSection formData={formData} setField={setField} meta={meta} />
            <ClassificationSection formData={formData} setField={setField} />
            <SalarySection formData={formData} setField={setField} />
            <StatusSection formData={formData} setField={setField} />
            <SettingsSection formData={formData} setField={setField} />
            <DescriptionSection formData={formData} setField={setField} />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Create Job" : "Update Job"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
