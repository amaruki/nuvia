"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHeader } from "@/contexts/dashboard-context";
import {
  Plus,
  Search,
  MoreHorizontal,
  Briefcase,
  Users,
  Edit,
  Trash2,
  MapPin,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchJobPostings, deleteJobPosting } from "./_lib/jobs-api";
import {
  EMPLOYMENT_TYPE_LABELS,
  formatDate,
  JOB_STATUS_LABELS,
  type JobStatus,
} from "@/types/jobs.types";

const STATUS_BADGE_STYLES: Record<JobStatus, string> = {
  DRAFT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  PUBLISHED: "bg-green-500/10 text-green-600 border-green-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  CLOSED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  FILLED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function JobsAdminPage() {
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setHeader({
      title: "Job Management",
      description: "Manage job postings, applications, and recruitment process.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs-list", searchQuery],
    queryFn: () => fetchJobPostings({ search: searchQuery || undefined, limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJobPosting,
    onSuccess: () => {
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ["jobs-list"] });
    },
    onError: (err) => {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete the job posting");
    },
  });

  const jobs = data?.items ?? [];
  const activeCount = jobs.filter((job) => job.status === "PUBLISHED").length;
  const totalApplicants = jobs.reduce((acc, job) => acc + job.applicationCount, 0);

  const handleDelete = (jobId: string, title: string) => {
    if (
      confirm(`Are you sure you want to delete "${title}"? This also removes its applications.`)
    ) {
      deleteMutation.mutate(jobId);
    }
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Button onClick={() => router.push("/dashboard/jobs/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Post New Job
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "–" : activeCount}</div>
            <p className="text-xs text-muted-foreground">currently live</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applicants
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "–" : totalApplicants}</div>
            <p className="text-xs text-muted-foreground">across all jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Postings
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "–" : (data?.total ?? 0)}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
      </div>

      {deleteError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {deleteError}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Applicants</TableHead>
                <TableHead className="text-right">Posted</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Loading jobs...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && error && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-destructive">
                    {error instanceof Error ? error.message : "Failed to load jobs."}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-semibold">{job.title}</span>
                        <span className="text-xs text-muted-foreground">{job.companyName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE_STYLES[job.status]}>
                        {JOB_STATUS_LABELS[job.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        {job.locationName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {job.applicationCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDate(job.publishedAt ?? job.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => router.push(`/jobs/${job.slug}`)}>
                            <Briefcase className="mr-2 h-4 w-4" /> View Public Page
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/jobs/${job.id}/applicants`)}
                          >
                            <Users className="mr-2 h-4 w-4" /> View Applicants
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/jobs/${job.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(job.id, job.title)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && !error && jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No jobs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
