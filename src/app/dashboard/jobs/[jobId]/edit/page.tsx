"use client";

import React, { useEffect } from "react";
import { useHeader } from "@/contexts/dashboard-context";
import { JobForm } from "../../_components/job-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { jobs } from "../../_data/mock-jobs";

export default function EditJobPage() {
  const { setHeader, clearHeader } = useHeader();
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const job = jobs.find((j) => j.id === jobId);

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

  if (!job) {
    return <div>Job not found</div>;
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
      <JobForm mode="edit" initialData={job} />
    </div>
  );
}
