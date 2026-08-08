"use client";

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHeader } from "@/contexts/dashboard-context";
import { JobForm } from "../../_components/job-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { fetchJobBoardMeta, fetchJobPosting } from "../../_lib/jobs-api";

export default function EditJobPage() {
  const { setHeader, clearHeader } = useHeader();
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const {
    data: job,
    isLoading: jobLoading,
    error: jobError,
  } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJobPosting(jobId),
    enabled: Boolean(jobId),
  });

  const {
    data: meta,
    isLoading: metaLoading,
    error: metaError,
  } = useQuery({
    queryKey: ["jobs-meta"],
    queryFn: fetchJobBoardMeta,
  });

  useEffect(() => {
    if (job) {
      setHeader({
        title: `Edit Job: ${job.title}`,
        description: "Update job details and status.",
      });
    }

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader, job]);

  const error = jobError ?? metaError;
  const notFound = !jobLoading && !jobError && jobId && !job;

  if (notFound) {
    return <div className="p-8 text-center text-muted-foreground">Job not found</div>;
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="pl-0 hover:pl-0 hover:bg-transparent"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Jobs
      </Button>

      {(jobLoading || metaLoading) && <div className="text-muted-foreground">Loading...</div>}
      {error && (
        <div className="text-destructive">
          {error instanceof Error ? error.message : "Failed to load the job posting."}
        </div>
      )}
      {job && meta && <JobForm mode="edit" initialData={job} meta={meta} />}
    </div>
  );
}
