"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHeader } from "@/contexts/dashboard-context";
import { applicants as initialMockApplicants, Applicant } from "../../../_data/mock-applicants";
import { jobs } from "../../../_data/mock-jobs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ApplicantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const jobId = params.jobId as string;
  const applicantId = params.applicantId as string;

  const job = jobs.find((j) => j.id === jobId);

  // In a real app, you would fetch this from an API.
  // Here we find it in the mock data, but we use local state to simulate status changes.
  const [applicant, setApplicant] = useState<Applicant | undefined>(
    initialMockApplicants.find((a) => a.id === applicantId && a.jobId === jobId),
  );

  useEffect(() => {
    if (applicant && job) {
      setHeader({
        title: `Applicant: ${applicant.name}`,
        description: `Applied for ${job.title}`,
      });
    }
    return () => clearHeader();
  }, [setHeader, clearHeader, applicant, job]);

  if (!job || !applicant) {
    return <div className="p-8 text-center text-muted-foreground">Applicant not found</div>;
  }

  const handleStatusChange = (newStatus: Applicant["status"]) => {
    setApplicant((prev) => (prev ? { ...prev, status: newStatus } : undefined));
  };

  const getStatusClass = (status: Applicant["status"]) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-none";
      case "Screening":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-none";
      case "Interview":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none";
      case "Offer":
        return "bg-green-100 text-green-800 hover:bg-green-100 border-none";
      case "Rejected":
        return "bg-red-100 text-red-800 hover:bg-red-100 border-none";
      default:
        return "";
    }
  };

  const statusOptions: Applicant["status"][] = [
    "New",
    "Screening",
    "Interview",
    "Offer",
    "Rejected",
  ];

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <span className="text-muted-foreground font-normal">Status:</span>
                <Badge variant="outline" className={`${getStatusClass(applicant.status)} ml-1`}>
                  {applicant.status}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusOptions.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={applicant.status === status}
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="default">
            <Mail className="mr-2 h-4 w-4" /> Email Candidate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Left Column: Info & Cover Letter */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{applicant.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-foreground">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{applicant.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center text-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applied Date</p>
                  <p className="text-sm">{applicant.appliedDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg">Cover Letter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-md text-sm leading-relaxed whitespace-pre-wrap font-serif text-foreground">
                {applicant.coverLetter || "No cover letter provided."}
              </div>
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
            <div className="flex gap-2">
              {applicant.resumeUrl && applicant.resumeUrl !== "#" && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={applicant.resumeUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> Open
                  </a>
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-card relative">
            {applicant.resumeUrl && applicant.resumeUrl !== "#" ? (
              <iframe
                src={applicant.resumeUrl}
                className="w-full h-full border-none"
                title="Resume Viewer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground">
                <FileText className="h-16 w-16 mb-4 opacity-50" />
                <p>No PDF available to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
