"use client";

import React, { useEffect } from "react";
import { useHeader } from "@/contexts/dashboard-context";
import { JobForm } from "../../_components/job-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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
      <JobForm mode="create" />
    </div>
  );
}
