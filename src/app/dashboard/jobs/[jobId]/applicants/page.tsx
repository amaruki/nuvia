"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHeader } from "@/contexts/dashboard-context";
import {
  fetchJobApplications,
  fetchJobPosting,
  updateApplicationStatus,
} from "../../_lib/jobs-api";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TRANSITIONS,
  formatDate,
  type ApplicationStatus,
} from "@/types/jobs.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, FileText, Mail, MoreHorizontal, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
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

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setHeader, clearHeader } = useHeader();
  const jobId = params.jobId as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);

  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJobPosting(jobId),
    enabled: Boolean(jobId),
  });

  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: () => fetchJobApplications(jobId, { limit: 100 }),
    enabled: Boolean(jobId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) =>
      updateApplicationStatus(jobId, applicationId, status),
    onSuccess: () => {
      setStatusError(null);
      queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
    },
    onError: (err) => {
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
    },
  });

  useEffect(() => {
    if (job) {
      setHeader({
        title: `Applicants: ${job.title}`,
        description: `Manage applications for ${job.companyName}`,
      });
    }

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader, job]);

  const applicants = applicationsData?.items ?? [];
  const filteredApplicants = applicants.filter(
    (app) =>
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantEmail.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isLoading && !job) {
    return <div className="p-8 text-center text-muted-foreground">Job not found</div>;
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/jobs")}
        className="pl-0 hover:pl-0 hover:bg-transparent"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Jobs
      </Button>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {applicationsData?.total ?? applicants.length} application
          {(applicationsData?.total ?? applicants.length) === 1 ? "" : "s"}
        </div>
      </div>

      {statusError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {statusError}
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied Date</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Loading applicants...
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              filteredApplicants.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/jobs/${jobId}/applicants/${applicant.id}`}
                      className="flex flex-col cursor-pointer hover:underline"
                    >
                      <span className="text-base font-semibold">{applicant.applicantName}</span>
                      {applicant.coverLetter && (
                        <span
                          className="text-xs text-muted-foreground truncate max-w-[200px]"
                          title={applicant.coverLetter}
                        >
                          {applicant.coverLetter}
                        </span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_BADGE_STYLES[applicant.status]}>
                      {APPLICATION_STATUS_LABELS[applicant.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(applicant.appliedAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {applicant.applicantEmail}
                      </div>
                      {applicant.portfolioUrl && (
                        <a
                          href={applicant.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 mt-0.5 text-primary hover:underline"
                        >
                          <FileText className="h-3 w-3" /> Portfolio
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <CheckCircle className="mr-2 h-4 w-4" /> Update Status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {APPLICATION_STATUS_TRANSITIONS[applicant.status].map((next) => (
                              <DropdownMenuItem
                                key={next}
                                onClick={() =>
                                  statusMutation.mutate({
                                    applicationId: applicant.id,
                                    status: next,
                                  })
                                }
                                disabled={statusMutation.isPending}
                              >
                                {APPLICATION_STATUS_LABELS[next]}
                              </DropdownMenuItem>
                            ))}
                            {APPLICATION_STATUS_TRANSITIONS[applicant.status].length === 0 && (
                              <DropdownMenuItem disabled>No Terminal status</DropdownMenuItem>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/jobs/${jobId}/applicants/${applicant.id}`)
                          }
                        >
                          <FileText className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && filteredApplicants.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No applicants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
