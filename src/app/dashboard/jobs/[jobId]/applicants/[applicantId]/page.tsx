"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHeader } from "@/contexts/dashboard-context";
import {
  fetchJobApplication,
  fetchJobPosting,
  updateApplicationStatus,
} from "../../../_lib/jobs-api";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TRANSITIONS,
  formatDate,
  formatSalary,
  type ApplicationStatus,
} from "@/types/jobs.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Mail,
  Calendar,
  FileText,
  ExternalLink,
  CheckCircle,
  Globe,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_BADGE_STYLES: Record<ApplicationStatus, string> = {
  PENDING: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-none",
  REVIEWING: "bg-purple-100 text-purple-800 hover:bg-purple-100 border-none",
  SHORTLISTED: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none",
  INTERVIEWING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none",
  OFFERED: "bg-teal-100 text-teal-800 hover:bg-teal-100 border-none",
  HIRED: "bg-green-100 text-green-800 hover:bg-green-100 border-none",
  REJECTED: "bg-red-100 text-red-800 hover:bg-red-100 border-none",
  WITHDRAWN: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-none",
};

export default function ApplicantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setHeader, clearHeader } = useHeader();
  const jobId = params.jobId as string;
  const applicationId = params.applicantId as string;

  const [statusError, setStatusError] = useState<string | null>(null);

  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJobPosting(jobId),
    enabled: Boolean(jobId),
  });

  const {
    data: application,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["job-application", jobId, applicationId],
    queryFn: () => fetchJobApplication(jobId, applicationId),
    enabled: Boolean(jobId && applicationId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      updateApplicationStatus(jobId, applicationId, status),
    onSuccess: () => {
      setStatusError(null);
      queryClient.invalidateQueries({ queryKey: ["job-application", jobId, applicationId] });
      queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
    },
    onError: (err) => {
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
    },
  });

  useEffect(() => {
    if (application && job) {
      setHeader({
        title: `Applicant: ${application.applicantName}`,
        description: `Applied for ${job.title}`,
      });
    }
    return () => clearHeader();
  }, [setHeader, clearHeader, application, job]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading applicant...</div>;
  }

  if (error || !application) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {error instanceof Error ? error.message : "Applicant not found"}
      </div>
    );
  }

  const allowedTransitions = APPLICATION_STATUS_TRANSITIONS[application.status];

  return (
    <div className="space-y-6 animate-fadeInUp h-[calc(100vh-140px)] flex flex-col">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="pl-0 hover:pl-0 hover:bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applicants
        </Button>

        <div className="flex items-center gap-3">
          {statusError && <span className="text-sm text-destructive">{statusError}</span>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <span className="text-muted-foreground font-normal">Status:</span>
                <Badge
                  variant="outline"
                  className={`${STATUS_BADGE_STYLES[application.status]} ml-1`}
                >
                  {APPLICATION_STATUS_LABELS[application.status]}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {allowedTransitions.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => statusMutation.mutate(status)}
                  disabled={statusMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {APPLICATION_STATUS_LABELS[status]}
                </DropdownMenuItem>
              ))}
              {allowedTransitions.length === 0 && (
                <DropdownMenuItem disabled>Terminal status</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Left Column: Info & Cover Letter */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{application.applicantEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applied Date</p>
                  <p className="text-sm">{formatDate(application.appliedAt)}</p>
                </div>
              </div>
              {application.portfolioUrl && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-foreground">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Portfolio</p>
                    <a
                      href={application.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {application.portfolioUrl}
                    </a>
                  </div>
                </div>
              )}
              {application.salaryExpectation !== null && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-foreground">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Salary Expectation</p>
                    <p className="text-sm">
                      {formatSalary(application.salaryExpectation, null, "USD")}
                    </p>
                  </div>
                </div>
              )}
              {application.availability && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-foreground">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Availability</p>
                    <p className="text-sm">{application.availability}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg">Cover Letter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-md text-sm leading-relaxed whitespace-pre-wrap font-serif text-foreground">
                {application.coverLetter || "No cover letter provided."}
              </div>
              {application.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">Internal Notes</p>
                  <div className="bg-muted/30 p-4 rounded-md text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {application.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Resume Viewer */}
        <div className="flex flex-col h-full bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-foreground" />
              <span className="font-medium text-sm">Resume Preview</span>
            </div>
            {application.resumePath && (
              <Button variant="ghost" size="sm" asChild>
                <a href={application.resumePath} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Open
                </a>
              </Button>
            )}
          </div>
          <div className="flex-1 bg-card relative">
            {application.resumePath ? (
              <iframe
                src={application.resumePath}
                className="w-full h-full border-none"
                title="Resume Viewer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground">
                <FileText className="h-16 w-16 mb-4 opacity-50" />
                <p>No resume uploaded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
