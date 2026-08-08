"use client";

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHeader } from "@/contexts/dashboard-context";
import { JobForm } from "../_components/job-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchJobBoardMeta } from "../_lib/jobs-api";

export default function CreateJobPage() {
  const { setHeader, clearHeader } = useHeader();
  const router = useRouter();

  useEffect(() => {
    setHeader({
      title: "Post New Job",
      description: "Create a new job posting for the careers page.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const {
    data: meta,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["jobs-meta"],
    queryFn: fetchJobBoardMeta,
  });

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

      {isLoading && <div className="text-muted-foreground">Loading form data...</div>}
      {!isLoading && error && (
        <div className="text-destructive">
          {error instanceof Error ? error.message : "Failed to load form data."}
        </div>
      )}
      {!isLoading && meta && <JobForm mode="create" meta={meta} />}
    </div>
  );
}
